class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],  // multiple error dena chahte hai ham too unhe array mai store krwa rhe hai
        stack = ""  // talking about errors ka stack
    ) {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false // success code nhi jaaega kyoki API Erros ko ham handle krr rhe hai API response ko handle nhi krr rhe hai
        this.errors = errors


        // agr ye if-else wala code smj nhi aaye too ham isko avoid bhi krr skte hai filhaal as it is likh denge
        if (stack) {
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this , this.constructor)
        }

    }
}


export { ApiError }