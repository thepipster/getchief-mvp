"use strict";
import { Logger } from "../utils/Logger";
// Import Admin SDK, https://github.com/firebase/firebase-admin-node
//import { initializeApp, cert, auth } from "firebase-admin/app";
import { assert } from "console";
import admin from "firebase-admin";
import { CreateRequest, DecodedIdToken, UpdateRequest, UserIdentifier, UserRecord } from "firebase-admin/auth";
import type { FirebaseAuthError } from "firebase-admin/lib/utils/error";
import { config } from "../config";
import { UserRole, UserStatus } from "../models/User";

const ECODE_USER_NOT_FOUND: string = "auth/user-not-found";

type FirebaseUser = Partial<UserRecord> & {
    uid: string;
    email: string;
    emailVerified?: boolean;
    phoneNumber?: string;
    password?: string;
    displayName?: string;
    photoURL?: string;
    disabled?: boolean;
};

export type FirebaseClaims = {
    role: UserRole;
    accountId: string;
    status: UserStatus;
};

export type FirebaseUserSearch = Partial<UserIdentifier> & {
    role: UserRole;
    accountId: string;
    status: UserStatus;
};

function toFirebaseUser(user: UserRecord): FirebaseUser {
    return {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        photoURL: user.photoURL,
        disabled: user.disabled,
    };
}
/*

ID Token Header Claims
alg	Algorithm	"RS256"
kid	Key ID	Must correspond to one of the public keys listed at https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
Verify the ID token's payload conforms to the following constraints:

ID Token Payload Claims
exp	Expiration time	Must be in the future. The time is measured in seconds since the UNIX epoch.
iat	Issued-at time	Must be in the past. The time is measured in seconds since the UNIX epoch.
aud	Audience	Must be your Firebase project ID, the unique identifier for your Firebase project, which can be found in the URL of that project's console.
iss	Issuer	Must be "https://securetoken.google.com/<projectId>", where <projectId> is the same project ID used for aud above.
sub	Subject	Must be a non-empty string and must be the uid of the user or device.
auth_time	Authentication time	Must be in the past. The time when the user authenticated.
*/
//export type FirebaseJWTToken = {}

/**
 * Interface to Firebase
 * @see https://github.com/firebase/firebase-admin-node
 */
class FirebaseHelper {
    public static init(): void {
        admin.initializeApp({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            credential: admin.credential.cert(config.firebaseConfig as any),
        });
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    /**
     * @see https://firebase.google.com/docs/auth/admin/manage-users
     * @param {string} email
     */
    public static async updateUserEmail(uid: string, newEmail: string): Promise<FirebaseUser> {
        return toFirebaseUser(await admin.auth().updateUser(uid, { email: newEmail }));
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    public static async deleteUserByEmail(email: string): Promise<void> {
        const FOUND_USER = await this.getUserByEmail(email);

        // If the user doesn't exist, then we are in the desired state already (i.e. the user not existing)
        if (FOUND_USER) {
            await this.deleteUser(FOUND_USER.uid);
        }

        return;
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    private static error_is_user_not_found(error: FirebaseAuthError) {
        return error.code === ECODE_USER_NOT_FOUND;
    }

    public static async deleteUser(uid: string): Promise<void> {
        try {
            await admin.auth().deleteUser(uid);
        } catch (e) {
            // if the error is "the user you are trying to delete does not exist"
            // then that's fine, we wanted to be in that state anyway
            if (this.error_is_user_not_found(e) === false) {
                throw e;
            }
        }
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    /**
     * Verify id tokens issued by firebase
     * @see https://firebase.google.com/docs/auth/admin/verify-id-tokens
     * @param {string} token
     */
    public static async verifyIdToken(token: string): Promise<DecodedIdToken> {
        try {
            return admin.auth().verifyIdToken(token);
        } catch (err) {
            Logger.error(`Error verifying token ${token}`, err);
            throw err;
        }
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    /**
     * Get a user from the auth database
     *
     * @param {string} uid
     *
     * @returns The user as a Firebase User or null if the user is not found
     */
    public static async getUserByUid(uid: string): Promise<FirebaseUser | null> {
        let result: FirebaseUser | null = null;
        try {
            result = toFirebaseUser(await admin.auth().getUser(uid));
        } catch (e) {
            if (this.error_is_user_not_found(e) === false) {
                throw e;
            }
        }

        return result;
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    /**
     * Get a user FROM THE AUTH database
     * @param {*} email
     */
    public static async getUserByEmail(email: string): Promise<FirebaseUser | null> {
        let result: FirebaseUser | null = null;
        try {
            result = toFirebaseUser(await admin.auth().getUserByEmail(email));
        } catch (e) {
            if (this.error_is_user_not_found(e) === false) {
                throw e;
            }
        }

        return result;
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    /**
     * Get all users FROM THE AUTH database, which includes the password hashes so this is good for a mass export
     * @see https://firebase.google.com/docs/auth/admin/manage-users#list_all_users
     * @see https://github.com/firebase/scrypt (notes on hash alogorithm)
     */
    public static async getAllUsers(): Promise<FirebaseUser[]> {
        const userList: FirebaseUser[] = [];
        let pageToken;
        let getMore = true;

        while (getMore) {
            const records = await admin.auth().listUsers(1000, pageToken);

            records.users.forEach((userRecord) => {
                userList.push(toFirebaseUser(userRecord));
            });

            pageToken = records.pageToken;
            if (!pageToken) {
                getMore = false;
            }
        }

        return userList;
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    /**
     *
     * Update an existing user, using the following fields;
     *
     * Property	     | Type     | Description
     * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     * email         | string   | The user's new primary email. Must be a valid email address.
     * emailVerified | boolean  | Whether or not the user's primary email is verified. If not provided, the default is false.
     * phoneNumber   | string	| The user's new primary phone number. Must be a valid E.164 spec compliant phone number. Set to null to clear the user's existing phone number.
     * password	     | string   | The user's new raw, unhashed password. Must be at least six characters long.
     * displayName	 | string   | The users' new display name. Set to null to clear the user's existing display name.
     * photoURL	     | string   | The users' new photo URL. Set to null to clear the user's existing photo URL. If non-null, must be a valid URL.
     * disabled	     | boolean	| Whether or not the user is disabled. true for disabled; false for enabled.
     *
     * @param {string} uid The user id (in firebase)
     * @param {FirebaseUser} updatedUserInfo The user info we want to change, see above.
     */
    public static async updateUser(uid: string, updatedUserInfo: FirebaseUser): Promise<FirebaseUser> {
        try {
            const updates: UpdateRequest = {};

            // Manually update the fields so ONLY the fields we allow can be updated
            if (updatedUserInfo.email) {
                updates.email = updatedUserInfo.email;
            }
            //if(updatedUserInfo.phoneNumber){
            //    updates.phoneNumber = updatedUserInfo.phoneNumber;
            //}
            if (updatedUserInfo.photoURL) {
                updates.photoURL = updatedUserInfo.photoURL;
            }
            if (updatedUserInfo.disabled) {
                updates.disabled = updatedUserInfo.disabled;
            }
            if (updatedUserInfo.displayName) {
                updates.displayName = updatedUserInfo.displayName;
            }

            const userRecord = await admin.auth().updateUser(uid, updates);

            if (userRecord) {
                return toFirebaseUser(userRecord);
            } else {
                throw new Error(`Error updating user ${updatedUserInfo.email}`);
            }
        } catch (err) {
            Logger.error(`Error updated user ${uid} with;`, updatedUserInfo, err);
            throw err;
        }
    }

    // ///////////////////////////////////////////////////////////////////////////////////////

    /**
     * Create a new user, using the following fields;
     *
     * @param {string} email The new user email
     * @param {string} name The new user name
     *
     */
    public static async createUser(email: string, name: string | undefined): Promise<FirebaseUser> {
        if (!email) {
            throw new Error("The e-mail address is a mandatory field.");
        }

        let result: FirebaseUser | null = null;
        try {
            const newUser: CreateRequest = {
                email,
                displayName: name || "",
            };

            const userRecord: UserRecord = await admin.auth().createUser(newUser);
            if (userRecord) {
                await admin.auth().setCustomUserClaims(userRecord.uid, {
                    role: UserRole.user,
                    accoundId: "",
                    status: UserStatus.pending,
                });

                result = toFirebaseUser(userRecord);
            } else {
                throw new Error(`Error creating user ${email}`);
            }
        } catch (err) {
            Logger.error(`Error creating user ${email}`, err);
            throw err;
        }

        assert(result !== null, "if result is not set, the code should have thrown an exception");
        return result;
    }

    // ///////////////////////////////////////////////////////////////////////////////////////
}

FirebaseHelper.init();

export { DecodedIdToken, FirebaseHelper, FirebaseUser };
