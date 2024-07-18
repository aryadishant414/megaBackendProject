class ApiResponse {
    constructor(statusCode , data , message = "Success")
    {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400  // TO understand this line Read About `Server status code` on google. bss thik thaak overview pata hona chhaiye not in deep.
    }
}