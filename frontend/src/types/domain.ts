/**
 * Enum for different chunking strategies used in Retrieval-Augmented Generation (RAG)
 * 
 * RAG is a technique that enhances large language model responses by retrieving relevant
 * information from a knowledge base before generating a response. The chunking strategy
 * determines how documents are divided into smaller pieces for efficient retrieval.
 */
export enum ChunkingStrategy {
    /**
     * Divides text into chunks of a fixed size (tokens or characters)
     * Best for: General purpose, consistent document types
     * Configuration: Use chunkSize and chunkOverlap
     */
    FIXED_SIZE = 'fixed_size',

    /**
     * Creates chunks based on semantic meaning using embeddings similarity
     * Best for: Complex documents with varying topics
     * Configuration: Use semanticThreshold to control chunk boundaries
     */
    SEMANTIC = 'semantic',

    /**
     * Chunks text by paragraph breaks
     * Best for: Well-structured documents with clear paragraph divisions
     * Configuration: Use separators to define paragraph boundaries
     */
    PARAGRAPH = 'paragraph',

    /**
     * Chunks text by sentence boundaries
     * Best for: Content where each sentence contains distinct information
     * Configuration: Use minChunkSize and maxChunkSize to control length
     */
    SENTENCE = 'sentence',

    /**
     * Combines multiple strategies (typically semantic + structural)
     * Best for: Complex, varied document collections
     * Configuration: Requires settings for both strategies being combined
     */
    HYBRID = 'hybrid'
}

/**
 * Interface for RAG chunking configuration
 */
export interface ChunkingConfig {
    /** The primary chunking strategy to use */
    strategy: ChunkingStrategy;
    
    /** Size of each chunk in tokens or characters (for FIXED_SIZE) */
    chunkSize?: number;
    
    /** Number of tokens/characters to overlap between adjacent chunks */
    chunkOverlap?: number;
    
    /** Custom separators for chunking text (for PARAGRAPH strategy) */
    separators?: string[];
    
    /** Minimum size for variable-length chunks (for SENTENCE, SEMANTIC) */
    minChunkSize?: number;
    
    /** Maximum size for variable-length chunks (for SENTENCE, SEMANTIC) */
    maxChunkSize?: number;
    
    /** Threshold for determining semantic boundaries (for SEMANTIC strategy) */
    semanticThreshold?: number;
}

