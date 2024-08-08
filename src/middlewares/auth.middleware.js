import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


// isme try-catch block ka use kiya hai kyoki ye ekk Database ka operation hai jisme error ke chances hote hai YE HAMNE STARTING MAI BHI DEKH LIYA HAI KI JAB BHI DATABASE KA KOI KAAM KRE TAB 2 CHIJE HAME PATA HONI CHHAIYE. 1. is Database mai error aa skti hai AND 2 is DATABASE IS IN ANOTHER CONTINENT
// YEH NICHE PARAMETER MAI '_' (underscore) hai wo response ko hee denote krr rha hai. AGR response mai kuch nhi hai tab ham 'underscore' likhte hai
export const verifyJWT = asyncHandler(async(req, _ ,next) => {

    console.log("VERIFY JWT ki COOKIES ke andar ki req ke andar hai : ",req.cookies);

    
    try {
        
        
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        
        console.log("Token ke andar hai : ",token);
        

        if(!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // console.log("DECODED token ke andar hai : ",decodedToken);

     
        
        
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")  // iss line mai '_id' : ye "user.model.js" ke andar jo hamara method banaya hai: 'generateAccessToken' uske anadar jo '_id' likha hai wo id hai ye 
    
        if (!user) {
            // TODO IN NEXT VIDEO -> discuss about frontend 
            throw new ApiError(401, "Invalid Access Token")
        }
    
        // console.log("req.user ke ANDAR HAI : " , req.user);
        
        req.user = user;  // yaha values set kri hai and ye next middleware ko pass hogi iski niche wali line ki help sai
        next()  // next means jese hee ye 'verifyJWT' method ka kaam pooora ho jaata hai wese hee hamne 'next()' ko call krdiya which is a methos jo jiska mtlb hai ki bhyii mera kaam too hogya abb tu next wale ke pass chala ja and next wale ke pass iske just upper wali line ki vajah sai user ka data send hoga. next means next middleware ko agr presenet hai too  agr iss verifyjWT middleware ke baad koi function hai too next ka mtlb wo function ho jaaega. VERY SIMPLE next mtlb next hota hai
        // SO next(): Calls the next middleware function in the stack.
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid aceess token")
    }

})


// NOTE : agr 'verifyJWT' ka use krke hamm bss yahi check krr rhe hai ki jo cookies hamare pass padi hai usme kya access token present hai ya nhi.
// Agr 'verifyJWT' kuch bhi error send nhi krrr rha hai it means ki access token present hai and user 'Logged in hai"

// NOTE: Agr hame access token nhi milta hai and verifyJWT kuch error deta hai too ham catch block ke andar 'refershToken' ke liye bhi condition likh skte hai ki kya refresh token present hai cookies mai ya nhi. agr present hai too usse naya access token bana lenge. BUT ISS REFRESH TOKEN SAI NAYA ACCESS TOKEN BANANE WALE CASE KA hamne alag hee route banaya hai. i.e -> 'router.route("/refresh-token").post(refreshAccessToken)' route