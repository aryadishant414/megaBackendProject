import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


// isme try-catch block ka use kiya hai kyoki ye ekk Database ka operation hai jisme error ke chances hote hai YE HAMNE STARTING MAI BHI DEKH LIYA HAI KI JAB BHI DATABASE KA KOI KAAM KRE TAB 2 CHIJE HAME PATA HONI CHHAIYE. 1. is Database mai error aa skti hai AND 2 is DATABASE IS IN ANOTHER CONTINENT
// YEH NICHE PARAMETER MAI '_' (underscore) hai wo response ko hee denote krr rha hai. AGR response mai kuch nhi hai tab ham 'underscore' likhte hai
export const verifyJWT = asyncHandler(async(req, _ ,next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if(!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")  // iss line mai '_id' : ye "user.model.js" ke andar jo hamara method banaya hai: 'generateAccessToken' uske anadar jo '_id' likha hai wo id hai ye 
    
        if (!user) {
            // TODO IN NEXT VIDEO -> discuss about frontend 
            throw new ApiError(401, "Invalid Access Token")
        }
    
    
        req.user = user;
        next()  // next means jese hee ye 'verifyJWT' method ka kaam pooora ho jaata hai wese hee hamne 'next()' ko call krdiya which is a methos jo jiska mtlb hai ki bhyii mera kaam too hogya abb tu next wale ke pass chala ja.
        // SO next(): Calls the next middleware function in the stack.
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid aceess token")
    }

})