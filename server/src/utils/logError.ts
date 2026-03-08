import colors from "colors";

export const logError = (context: string): void => {
  console.log(
    colors.bgRed.white.bold(" ERROR ") + colors.red(` ${context}`)
  );
};