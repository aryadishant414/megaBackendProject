import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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
    const {fullName, email, username, password} = req.body
    console.log("email is : " , email);  // just checking ki data aaya hai ya nhi. iss line ke baad 'postman' mai jaake 'body' option ko select krke usme 'raw' option mai 'json' ko select krke vha sai email send krdena. isse hoga kya ki wo postman ne email send krke frontend ka kaam krliya abb wo email aayega iss backend ke terminal par. But Note : ye krne ke liye hamara server start rehna chahiye 






    // ese bhi krr skte hai but isme bohot saare 'if' likhne pdenge so isse better tarike ka hamm use krenge iss commented wale ke just niche dekhlo. if ke andar array daala hai and now we know ki array ke anadr haamm loop laga skte hai
    // if(fullName === "") {
    //     throw new ApiError(400, "fullname is required")
    // }

    if(
        [fullName, email, username, password].some((eachField) => eachField?.trim() ==="")
    ) {
        throw new ApiError(400, "All fields are required")
    }



    const existedUser = User.findOne(
        {
            $or: [{username} , {email}]
        }
    )

    if(existedUser) {
        throw new ApiError(409 , "User with email or username already exists")
    }


   const avatarLocalPath =  req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;


    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }


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


export {registerUser}

