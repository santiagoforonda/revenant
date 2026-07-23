import { revenantApi } from "../../api/RevenantApi";
import type { LoginResponse } from "../interfaces/auth-response";


export const loginAction= async(username:string,password:string):Promise<LoginResponse> =>{
    try{
        const {data} = await revenantApi.post<LoginResponse>("/auth/login",{
            username:username,
            password:password
        })

        return data;
    }catch(error){
        console.info(error);
        throw error;
    }
}