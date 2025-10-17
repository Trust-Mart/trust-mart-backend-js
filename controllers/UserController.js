import db from "../models/index.js";
import { ApiResponse } from "../utils/apiResponse.js";
const { User, Product } = db;

export const userDetails = async (req, res) => {  
    try {
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        return ApiResponse.success(res, {
            message: "user retrieved succesfully",
            user
        })
    } catch (error) {
        console.log("error fetching user details: ", error);
        return ApiResponse.serverError(res, error.message || "error fetching user details", error.response?.data)
    }
}

export const usersAndProducts = async (req, res) => {  
    try {
        const allUsers = await User.findAll({
            attributes: { 
                exclude: [
                    'password', 
                    'privateKey', 
                    'pin', 
                    'verificationToken'
                ] 
            },
            include: [{
                model: Product,
                as: 'products',
                attributes: ['id', 'status'], // Only include necessary product fields
                required: false
            }],
            order: [['createdAt', 'DESC']]
        });

        // Transform data to include products count
        const usersWithStats = allUsers.map(user => {
            const safeData = user.getSafeUserData();
            return {
                ...safeData,
                productsCount: user.products ? user.products.length : 0,
                activeProductsCount: user.products ? 
                    user.products.filter(p => p.status === 'active').length : 0
            };
        });

        return ApiResponse.success(res, {
            message: "Users retrieved successfully",
            users: usersWithStats,
            count: usersWithStats.length
        });
    } catch (error) {
        console.log("Error fetching user details: ", error);
        return ApiResponse.serverError(res, "Error fetching user details");
    }
}