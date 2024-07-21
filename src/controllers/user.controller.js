import {asyncHandler} from "../utils/asyncHandler.js"

const registerUser = asyncHandler( async (req , res) => {
    return res.status(200).json({
        message: "Dishant aur code"
    })
})


export {registerUser}

