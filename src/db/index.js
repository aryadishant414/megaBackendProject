// This file is purely a Database connection file. ISME KEwaL SIrf DAtaBase hee Create ho rha hai..
//  isme hamne 'express ki app' wagara kuch bhi create nhi kra hai jese hamm 'index.js'(project root folder waali file) mai krr rhe the. YAha bhi uske jese kachra/messy/inconsistent code thori likhna hai

import mongoose from 'mongoose';

import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDb connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED" , error);
        process.exit(1)  // iss baar throw ki jagah exit krwaya hai
    }
}

export default connectDB

// `process` => `node.js` hame access detaa hai process ka KII hamm process ko hai bhi use krr skte hai.
// process means ki ye jo current hamari application chal rhi hai na ye ekk process par chal rhi hogi and ye uska ekk reference hai
