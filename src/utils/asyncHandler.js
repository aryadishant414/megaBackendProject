
// Higher Order Function hai ye niche wala funtion i.e `asyncHandler` function
const asyncHandler = (requestHandler) => {
    (req , res , next) => {
        Promise.resolve(requestHandler(req , res , next)).catch((err) => next(err))
    }
}


export { asyncHandler }
// Yaa fiir `export default asyncHandler` bhi likh skte hai
























// Step1
// const asyncHandler = (fn) => {}


/*  Step2  
const asyncHandler = (fn) => 
    {
        (fn) => {}
    }
*/

// or Step 2 : isme bss curly braces hata diye hai or kuch nhi BAAKi poora same hee hai uppar wale step 2 ke
// const asyncHandler = (fn) => () => {}

// Step 3
// const asyncHandler = (func) => async () => {}    

// NOte : ye upper waale tino steps ko sirf smjne ke liye likha hai ki ye niche wala function kese likha hai bss
// NOTE : `Higher Order Function` -> niche jo ye COMPLEX saa function dikh rha hai (i.e `asyncHandler` function) isse hee keh rhe  hai ham `Higher Order Function`

// Higher Order Function : Wo functions jo ki dusre function ko as a parameter bhi accept krte hai and unnhe return bhi krte hai. IN Short Higher Order functions ke parameter ke andar jo functions aate hai unhe as a Varibale ke jese hee treat krta hai yeh ye `High Order functions` BSS itna saa hee concept hai








// Higher Order Function hai ye niche wala funtion i.e `asyncHandler` function. NOTE : ye function bhi exact same hee work krr rha hai jo sabse upper wala 'asyncHandler' function krr rha hai. Bss ye alg tarika hai and wo alag tarika hai 
// const asyncHandler = (fn) => async (req , res , next) => {
//     try {
//         await fn(req , res , next) // yaha ye function ko execute krwa rhe hai jo hamare 'asyncHandler' function ke parameter mai aaya tha
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }

