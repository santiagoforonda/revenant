import { revenantApi } from "../../api/RevenantApi";
import type { RegisterResponse } from "../interfaces/auth-response";


export const registerAction= async(username:string,email:string,password:string,playerType:string):Promise<RegisterResponse>=>{

    try{
        const {data} = await revenantApi.post<RegisterResponse>("/auth/register",{
            username:username,
            email:email,
            password:password,
            playerType:playerType
        })

        return data;
    }catch(error){
        console.info(error);
        throw error;
    }
}