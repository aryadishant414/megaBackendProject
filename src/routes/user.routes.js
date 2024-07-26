import { Router } from "express";
import { 
    changeCurrentUserPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    loginUser, 
    logoutUser, 
    registerUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage 
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1  // means kitni files upload krna chhahta hu
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser

)


router.route("/login").post(loginUser)


// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

// bache hue routes
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)  // isme 'get' method ka use isliye kiya hai kyoki hamm sirf information le rhe hai kuch bhi bhej nhi rhe hai. BUT agr hamm chahe too ham 'post' method ka bhi use krr skte hai

router.route("/update-account").patch(verifyJWT, updateAccountDetails) // 'patch' use kiya hai kyoki sirf kuch jo updates hue hai sirf vhi changes krne hai saari fields ko change/update nhi krna hai. Galti sai bhi 'post' mat rkh dena isko nhi too saari hee details update ho jaaegi 'post' sai too

router.route("/avatar").patch(
     verifyJWT,
     upload.single("avatar"), 
     updateUserAvatar) // iss route mai hamne 2 middlewares use kre hai : pehle verify wala middleware use hoga then uske baad upload (multer middleware hee hai) wala middleware use hoga then last mai hamne update wale method ko call krwaya hai. AND PATCH isliye use kiya hai kyoki sirf ekk hee too update krna hai i.e hamara 'avatar'


// TODO 26-07-2024 -> COVER IMAGE KA ROUTE LIKHO  -> DONE 
router.route("/cover-image").patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)  // isme route "/c/:" esa isliye diya hai kyoki 'getUserChannelProfile' mai ham yeh krr rhe hai -> `const {username} = req.params` . MTLB KI "URL" mai sai kuch le rhe hai. AND JAB BHI URL MAI SAI KUCH LETE HAI ISKE METHOD MAI (in this case talking about `getUserChannelProfile` method) TAB HAME ESA HEE ROUTE LIKHNA HOTA HAI

router.route("/history").get(verifyJWT, getWatchHistory)

export default router