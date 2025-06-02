export class ApiError extends Error {

    constructor(

        public code: string = 'UNKNOWN',

        public status: number = 500,

        message: string = '에러가 발생했습니다.') { super(message); this.name = 'ApiError'; }

}