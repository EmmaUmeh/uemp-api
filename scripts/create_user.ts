import UserModel from "../models/user.model";



export const createUser = async(user_data: any)  => {

    const user_create = UserModel.create(user_data);
}