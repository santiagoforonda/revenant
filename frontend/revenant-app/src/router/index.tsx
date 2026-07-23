import {createBrowserRouter} from "react-router-dom";
import { LoginPage } from "../auth/pages/login/LoginPage";
import { RegisterPage } from "../auth/pages/register/RegisterPage";
import { GamePage } from "../game/pages/GamePage";

export const router = createBrowserRouter([
    {
        path:"/",
        element:<LoginPage></LoginPage>
    },
    {
        path:"/register",
        element:<RegisterPage></RegisterPage>
    },
    {
        path:"/game",
        element:<GamePage></GamePage>
    }
])