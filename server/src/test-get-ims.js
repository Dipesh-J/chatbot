import connectDB from './config/db.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import { Composio } from 'composio-core';

dotenv.config({ path: '../../.env' });

async function run() {
    try {
        const client = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
        await connectDB();
        const user = await User.findOne({ email: 'dipeshjoshi015@gmail.com' });

        const entity = client.getEntity(user._id.toString());
        const connection = await entity.getConnection({ app: 'slack' });

        const result = await entity.execute({
            actionName: 'SLACK_LIST_CONVERSATIONS',
            params: {
                types: 'im,mpim',
                limit: 10
            },
            connectedAccountId: connection.id
        });

        if (result.data?.channels) {
            console.log("First IM Details:", JSON.stringify(result.data.channels[0], null, 2));

            // Now fetch all users to map the name
            console.log("Fetching all users...");
            const usersResult = await entity.execute({
                actionName: 'SLACK_LIST_ALL_USERS',
                params: { limit: 200 }, // Assuming less than 200 users for this test
                connectedAccountId: connection.id
            });

            console.log("Users API Data structure:", JSON.stringify(usersResult.data, null, 2).substring(0, 500));
            // try to parse where members are
            let users = [];
            if (usersResult.data?.members) users = usersResult.data.members;
            else if (usersResult.data?.data?.members) users = usersResult.data.data.members;
            else if (usersResult.data?.users) users = usersResult.data.users;
            else if (Array.isArray(usersResult.data)) users = usersResult.data;

            console.log(`Fetched ${users.length} users`);

            result.data.channels.forEach(channel => {
                if (channel.is_im) {
                    const user = users.find(u => u.id === channel.user);
                    console.log(`IM ${channel.id} is with user: ${user ? (user.real_name || user.name) : 'Unknown'}`);
                }
            });
        }
    } catch (err) {
        console.error("Script error:", err.message || err);
    } finally {
        process.exit(0);
    }
}
run();
