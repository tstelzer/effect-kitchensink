/// <reference types="vitest" />
import { UserConfig } from "vite"

const config: UserConfig = {
    test: {
        include: ["./src/**/*.(test|spec).{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        reporters: "verbose",
        globals: false,
    },
}

export default config;
