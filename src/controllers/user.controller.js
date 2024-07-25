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
    .json(new ApiResponse 
        (200, 
        req.user, 
        "current User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
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

    // TODO delete Old Image - assignment

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


// Subscription wala logic 
const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {  // 1st pipeline
            $match: {  // `$match` operator of MongoDb Work : $match says ki Kya database ke andar ye user Hai bhi ya nhi Jiss bhi user ke account par maine visit kiya hai (mtlb ki frontend mai) suppose hamne visit kiya CHANNEL : "chaiaurcode" `youtube` par. NOW AGR USERNAME mill gaya hai too username ke andar ye usrname ki value(jo ki obvious hai text value hogi wo daaldi hai IN SHORT YE USER kI ABB HAMM POORI Kundali dekhenge) next abb ham next hamara kaam krenge jese kitne subscribers hai nd all Isse aage waali pipeline mai.
                username: username?.toLowerCase()
            }
        },
        {  // 2nd pipeline (isme hamne saare Subscribers find krliye hai)
            $lookup: {  // lookup too 'Array' of objects return krta hai by default.
                from: "subscriptions",  // this line means ki iss model mai sai dekho. Ye vhi `export` wala name hai jo ki 'subscription' wale model mai hamne export krte time likha tha ki database mai kya name sai save krwana hai or saath me ye IMPORTANT CHIJ bhi dekhi thi ki database mai ye JAB SAVE hoga tab lowercase mai hoga and plural ho jaaega naam
                localField: "_id", // mtlb ki hamare model mai iska local name kya hai jisko bhi hamne `foreign-field` waali field mai value diya hai uska
                foreignField: "channel",
                as:"subscribers" // ye returned name hai jo bhi hamm dena chahe
            } // So iss lookup sai hame targeted channel ke saare subscribers mill haye honge
        },
        {   // 3rd pipeline (Maine kitne Channels ko Subscribe kiya hai Ye find krr rhe hai isme ham)
            $lookup: { 
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }

        },
        {   // 4th pipeline (Jo jo fields/information uss `targeted user ke document mai padi hai` wo too hai hee uske alawa kuch fields hamm hamari taraf sai add krr rhe hai)
            $addFields: {  // 'addFields' wo value return krta hai jo uske fields ke andar calculate krr rhe hote hai ham. Suppose in this case hamm subscribers ka count nikal rhe hai too IT WILL RETURN Numeric value
                subscribersCount: { // iske andar hamne calculation ka logic likha hai
                    $size: "$subscribers"  // '$' isliye lagaya hai kyoki "subscribers abb ekk field hai" (jo ki 2nd pipeline mai loopkup ne return kri thi. BY Default Returned as "Array")
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {  // jo user mere account par aaya hai kya usne muje subscribe kiya hai ya nhi
                   $cond: {
                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false
                   }
                }

            }
        },
        { //5th pipeline (ISS pipeline mai ham 'project' operator ka use krr rhe hai ki ham saari fileds return nhi krenge uss user ki Jo ham provide karwa rhe hai vhi return krenge)
            $project: {
                fullName: 1, // flag on krdiya
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    // console.log(channel) // just to check the return type. Ki Aggregation pipelime hame `return` kya kar rha hai. DOCUMETATION MAI BHI READ KRNE AND DEKHNA. NOTE : jitne bhi Aggregation Pipelines hai mostly Array hee return krte hai. AND HAA Hamara iss "Subscription" wale case mai jo Array return hoke aaya hai usme sai `1st value`(Pehli value) hee Usefull hai.

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res 
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

})

// Watch history wala logic
const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        { // 1st pipeline (aggregation pipeline) -> isse hame user mill gaya hai jiski watch history nikalni hai
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)  // yaha hamne mongoose ki object id banayi hai
            }
        },
        { // 2nd pipeline (jo user mila hai uski watch history ke andar chalte hai).
            $lookup: { //isme 'users' model ke andar hai ham
                from: "videos", // ye name wo name hai jo ki hamare database ke andar saved hai 'video' model ka jo ki hamne export krte time ""(double-quotes) mai bataya tha.
                localField:"watchHistory",  // ye user model ke andar ka local field hai
                foreignField:"_id",  // we know ki id too harr kisiki automatic bana deta hai database
                as: "watchHistory",
                pipeline: [ // sub-pipeline banayi hai kyoki isse uppr wale step tak kya hua tha ki hamari watchHistory wali field jo ki lookup ke through `hamare user` ki fields mai add hue hai uske andar abhi videos aagyi hai jo-jo user ne dekhi thi. But jo videos user ne dekhi hai uska owner kon hai uske baare mai koi bhi information nhi aayi hai abhi tak. Jese hamari youtube history mai jo bhi video hamne dekha hai uss video ka photo, user kon hai, channel name wagara information aati hai na BSS VAHI INFORMATION add krne ke liye hamm issliye hamne ye sub-pipeline likhi hai
                    { // iss pipeline mai, iss step mai abb ham khade hai 'videos' ke andar jo watch history mai aaye hai
                        $lookup: { // isme 'videos' model ke andar hai ham
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",  // ye name ham hamari mrzi sai de skte hai 
                            pipeline: [ // Sub-pipeline. Inn sub-pipelines ko ham yeh bhi keh skte hai ki pipelines ki nesting ho rhi hai
                                {
                                    $project: { // isme 'users' model ke andar hai ham and uski kya kya information return krwani hai uska logic likh rhe hai ham
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },

                    // ye niche waali pipeline is options. ISKO Bss frontend wale ke liye aasani ho jaae islie likh rhe hai ham. kyoki uppe wali jo last pipelines hamne likhi thi vha tak aaye hai mtlb ki 'owner' wali field ke andar saara data pada hai Jo ki ekk "Array of objects" return krega yeh hame pata hai. TOo Frontend wale ko baar baar array ke andar jaake uska '0th' element access na krna pade and usko direct hee ye data mill jaae too wo bhi kahega ki backend wala banda acha hai data ache sai bhejta hai hame
                    { // another pipeline
                        $addFields: {
                            owner: { // owner name ki field ko hee overwrite krdiya hai already yeh field padi thi too new field q hee banaye ham. Abb frontend wale ko owner field ke andar sirf yahi dikhega jo ki hamne niche likha hai i.e inside "first wali field"
                                $first: "$owner" // this line means ki jo array of objects return hua hai uss array mai sai muje first field nikalke dedo
                            }
                        }
                    }
                ]

            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        
        )
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
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}

