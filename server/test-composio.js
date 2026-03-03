import { Composio } from 'composio-core';
import dotenv from 'dotenv';
dotenv.config();

const client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
console.log(Object.keys(client));
if (client.connectedAccounts) {
    console.log(Object.keys(client.connectedAccounts));
} else {
    console.log("No connectedAccounts on client");
}

async function testDelete() {
    try {
        const entityUrl = await client.getEntity("test_entity_123");
        console.log("Entity:", Object.keys(entityUrl));
    } catch (e) {
        console.error(e);
    }
}
testDelete();
