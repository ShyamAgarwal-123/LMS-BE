export const generateRefreshToken = async (res, user) => {
  try {
    const refreshToken = user.generateRefreshToken();
    if (!refreshToken)
      throw new ApiError({
        statusCode: 500,
        message: "Unable to Create the Refresh Token",
      });
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return refreshToken;
  } catch (error) {
    return res.status(error.statusCode || 500).json(
      new ApiResponse({
        statusCode: error.statusCode || 500,
        message: error.message,
      })
    );
  }
};

export const generateAccessToken = (res, user) => {
  try {
    const accessToken = user.generateAccessToken();
    if (!accessToken)
      throw new ApiError({
        statusCode: 500,
        message: "Unable to Create the Access Token",
      });
    return accessToken;
  } catch (error) {
    return res.status(error.statusCode || 500).json(
      new ApiResponse({
        statusCode: error.statusCode || 500,
        message: error.message,
      })
    );
  }
};
