import env from 'dotenv'
let environment = env.config()

const getEnv = function(){
    if(environment.error){
        throw new Error("Environment error, check .env file");
    }
    
    let env = environment.parsed;
    
    if(!env)
    {
        throw new Error("Environment error, bad environment variables", env);
    }
    console.log("loaded environment", env)
    return env;    
}
export default  getEnv();