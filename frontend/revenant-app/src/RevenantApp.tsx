import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { router } from "./router/index";
import {Toaster} from "react-hot-toast"

const queryClient = new QueryClient();

export const RevenantApp = () => {
  return (
    <QueryClientProvider client={queryClient}>
        <Toaster></Toaster>
        <RouterProvider router={router}></RouterProvider>
    </QueryClientProvider>
  )
}
