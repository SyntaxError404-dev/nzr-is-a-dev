import { Client, PollinationsAI, DeepInfra, Together, Puter, HuggingFace, Worker, Audio } from './client.js';

const providers = {
    "G4F": {
        name: "GPT4Free",
        class: Client,
        options: {}
    },
    "PollinationsAI": {
        name: "Pollinations AI",
        class: PollinationsAI,
        options: {}
    },
    "DeepInfra": {
        name: "DeepInfra",
        class: DeepInfra,
        options: {}
    },
    "Together": {
        name: "Together AI",
        class: Together,
        options: {}
    },
    "Puter": {
        name: "Puter",
        class: Puter,
        options: {}
    },
    "HuggingFace": {
        name: "Hugging Face",
        class: HuggingFace,
        options: {}
    },
    "Worker": {
        name: "Worker",
        class: Worker,
        options: {}
    }
};

export function createClient(provider, options = {}) {
    const providerConfig = providers[provider];
    if (!providerConfig) {
        throw new Error(`Unknown provider: ${provider}`);
    }
    
    const mergedOptions = { ...providerConfig.options, ...options };
    return new providerConfig.class(mergedOptions);
}

export default providers;
