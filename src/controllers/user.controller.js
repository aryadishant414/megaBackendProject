import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


// method for generating 'Access and Refresh Tokens'. 
// ISME 'asyncHandler' (Higher Order function ki need nhi hai kyoki ye function 'web' sai kuch bhi request nhi kar rha hai ye bss apne hee anadar jo method bana hu hai usko call krr rha hai. TOO OBVIOUS HAI USKE ANDAR HAME 'asynHandler`('TRY-CATCH' ko repeat mai likhne ki problem ko solve krta hai) method ki jrurat nhi hai)
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId) // find user in database
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken // database ke andar jo 'user object' hai uske andar refresh token daaldiya IN SHORT DATABASE KE ANDAR HEE DAALA HAI KYOKI YE 'user' OBJECT HAI TOO DATABASE KA HEE INSTANCE/OBJECT
        await user.save( {validateBeforeSave : false} ) // yaha database ke andar save hua hai. line line means ki muje pata hai mai kya karr rha hu tum bss isko database ke andar save krwado validation krne ki koi jrurat nhi hai.

        return {accessToken, refreshToken}
       
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}




const registerUser = asyncHandler( async (req , res) => {

    // Steps
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username , email sai check krenge
    // check for images, check for avatar uploaded by `multer`(on local storage) or not
    // upload them to cloudinary, and check avatar uploaded on `cloudinary` or not
    // create user object - create entry in db
    // check user created or not
    // return response


    // ye niche wali line sai saari text fileds handle krr rhe hai jo user ne submit kri hai
    const {fullName, email, username, password} =  req.body
    // console.log("email is : " , email);  // just checking ki data aaya hai ya nhi. iss line ke baad 'postman' mai jaake 'body' option ko select krke usme 'raw' option mai 'json' ko select krke vha sai email send krdena. isse hoga kya ki wo postman ne email send krke frontend ka kaam krliya abb wo email aayega iss backend ke terminal par. But Note : ye krne ke liye hamara server start rehna chahiye 


    // console.log("request body ke andar hai : " ,req.body)  // just for testing purpose






    // ese bhi krr skte hai but isme bohot saare 'if' likhne pdenge so isse better tarike ka hamm use krenge iss commented wale ke just niche dekhlo. if ke andar array daala hai and now we know ki array ke anadr haamm loop laga skte hai
    // if(fullName === "") {
    //     throw new ApiError(400, "fullname is required")
    // }

    if(
        [fullName, email, username, password].some((eachField) => eachField?.trim() ==="")
    ) {
        throw new ApiError(400, "All fields are required")
    }



    const existedUser = await User.findOne(
        {
            $or: [{username} , {email}]
        }
    )

    if(existedUser) {
        throw new ApiError(409 , "User with email or username already exists")
    }
    // console.log("req.files ke anadar hai : ",req.files);  // just for testing purpose


   const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; // isse thora classic way sai ham 'localCover' image ko handle krr rhe hai. iske just niche dekho

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is requiredzz")
    }

    // console.log("avatar local path is : " , avatarLocalPath)  // just for testing purpose

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    if(!avatar) {
        throw new ApiError(400 , "Avatar file is required")
    }


    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser) {
    throw new ApiError(500 , "Something went wrong while registering the user")
   }

   return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
   )


})

const loginUser = asyncHandler( async (req, res) => {
    // Steps
    // get user details from frontend -> req.body
    // validation -> username or email check
    // find the user
    // password check -> password send by user and password stored in mongodb should be same
    // access and refresh token -> (ye baar baar use honge isliye iska ekk alg sai method hee bana dete hai ham)
    // send cookie -> jo bhi hamne kaam kiya hai usko cookies mai bhejdo



    const {email, username, password} = req.body

    if (!(username || email)) { // user ko inn dono mai sai ekk field too send krni hee pdegi for login 
        throw new ApiError(400, "username or email is required")
    }

    // alternate of upper condition : 
    // if (!username && !email) { // user ko inn dono mai sai ekk field too send krni hee pdegi for login 
    //     throw new ApiError(400, "username or email is required")
    // }

    const user = await User.findOne({  // here finding user exist or not
        $or: [{username}, {email}]  // ye MongoDb ki ekk query hai
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // checking password (AT TIMESTAMP : 15:07 VIDEO-16) NOTE : 'user' and 'User' both are different. 'user': jo user details bhej rha hai wo hai And 'User' :  Mongoose model that interacts with our MongoDB database. THORA CONFUSING HAI BUT BOTH ARE DIFFERENT YE BAAT YAAD RKHNA
    // SO : 
    // User: Use this to interact with the database (e.g., findOne, create, etc.). Only used in CRUD OPERATIONS
    // user: Use this instance to call custom methods like isPasswordCorrect.
    const isPasswordValid = await user.isPasswordCorrect(password)
    // console.log("USER KE PASSWORD HAI : " , isPasswordValid)  // 987654321
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }


    // now generating access and refresh tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    //send cookie
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {  // jab bhi ham cookie bhejte hai tab bydefault uska nature editable rehta hai mtlb ki koi bhi usko edit wagara krr skta hai tab wo secure nhi rehti hai BUT BY USING THESE BELOW OPTIONS hamari cookies ko frontend par read too krr paaenge but wo edit sirf backend par hee ho skti hai SO THIS IS A SAFE PRACTICE WHILE SENDING THE COOKIES
        httpOnly: true,
        secure: true
    }



    return res
    .status(200)
    .cookie("accessToken", accessToken, options) // user ko cookie send krr rhe hai server sai. user ke browser mai send hoti hai cookies
    .cookie("refreshToken", refreshToken, options) 
    .json(
        new ApiResponse(
            200,
            { //json mai data bhej rhe hai mtlb ki user directly use krr skta hai 'access and refresh tokens' immediatelty after login
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )


    // v.imp NOTE : 
    // 'cookies' -> stores the information .
    // jab bhi ham cookies mai koi data bhejte from the server tab cookies mai jo bhi likha hota hai wo sab server send krta hai `user ke browser par`. so next time jab bhi `logged in user` esee hee same koi request kre tab uss `logged in user kaa` browser automatically uss request ko handle krdega and harr baar usko server sai request nhi krni pdegi.

    //When we are sending our data in 'cookies' TAB WE HAVE TO RELY (Bharosa krna) on our browser. WHICH IS A SAFE OPTION

    //When we are sending our data in 'json' TAB HAME uss data ka immediate access too mill jaata hai (jo ki cookies mai bhejne sai nhi milta hai) jisse hamm uss data ko immediately jese hee user login krta hai tab use krr skte hai BUT its not safe. BUT HO SKTA HAI USER KI MAJBOORI HO YAA FIIR USER KA USE CASE HEE KUCH ESA HO SO IT ALL DEPENDS ON KI HAM HAMARA DATA COOKIES KE THROUIGH BHEJNA CHHATE HAI YA FIIR JSON MAI BHEJNA CHHATE HAI YAA FIR SIRF KISI EKK MAI BHEJNA CHHAHTE HAI YAA FIIR DONO MAI HEE BHEJNA CHHATE HAI 



})


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,  // query to find user
        { // yaha batate hai ki update krna kya hai
            $set: {
                refreshToken : undefined
            } // '$set' -> MongoDb operator
        },
        {
            new : true  // This option ensures that the method returns the updated document rather than the original.
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler( async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
    
        if (!user) { // means ki agr database mai user nhi mila too?
            throw new ApiError(401, "Invalid refresh token")  // mtlb ki user ne jiss refresh token ki id database sai maangi sai wo token hee galat hai esa koi token database mai exist nhi krta hai
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentUserPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body

// agr confirm password bhi user bhej rha hai too
    // if(!(newPassword === confirmPassword)) {
    //     throw new ApiError(400, "Wrong confirm and new password")
    // }  



    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {   // this set is MongoDb Operator
                fullName: fullName,  // dono same hee hai islie Agr sirf fulname hee likhenge too bhi chalega
                email: email  // only email bhi likh skte hai YE HAMNE Javascript mai pdha tha ki agr same names ho too ekk hee baar likh skte hai
            }
        },
        {new: true} // isse update hone ke baad waali information return hoti hai
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is mising")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await Url.findByIdAndUpdate(
        req.user._id,
        {
            $set: { // $set is MongoDb ka Operator
                // ye avatar jiski ham value set kar rhe hai wo hamare user model ke 'avatar' wala avatar hai jo ki ekk url accept krta hai from cloudinary. SEE FROM 'user.model.js' file
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")  // this line is used to exclude the password from the response that is sent back to the user. SECURITY Purpose ke liye krte hai ham esaa
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar Image Updated Successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is mising")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading Cover Image on Cloudinary")
    }

    const user = await Url.findByIdAndUpdate(
        req.user._id,
        {
            $set: { // $set is MongoDb ka Operator
                // ye avatar jiski ham value set kar rhe hai wo hamare user model ke 'avatar' wala avatar hai jo ki ekk url accept krta hai from cloudinary. SEE FROM 'user.model.js' file
                coverImage: coverImage.url  // ye 'coverImage.url WO URL hai jo ki cloudinary par upload hua hai
            }
        },
        {new: true}
    ).select("-password")  // this line is used to exclude the password from the response that is sent back to the user. SECURITY Purpose ke liye krte hai ham esaa

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover Image Updated Successfully")
    )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage

}

