import { Request } from "express";
import { Domain } from "../models/Domain.entity";
import { Agent } from "../models/Agent.entity";

/**
 * Here we can explicitly define the properties that we want to add to the Request object.
 */
export interface CustomRequest extends Request {
    agent?: Agent;
    domain?: Domain;
}
