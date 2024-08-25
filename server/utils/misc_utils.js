import { customerDefaultValues } from "../models/customer.js";

export const extendDateByMonth = (date, months) => {
    if(!date){
        date = new Date()
    }
    const now = new Date()
    let dateRes;
    if(date < now){
        dateRes = now.setMonth(now.getMonth() + months)
    }else{
        console.log('date', date, typeof date)
        dateRes = date.setMonth(date.getMonth() + months)
    }
    return dateRes
}

export const isEmpty = (obj) => {
    for(const key in obj) {
        if(Object.hasOwn(obj, key)){
            return false;
        }
    }
    return true;
}

export const parseCustomerInfo = (body) => {
    
    const fields = body["basicInfo"]?Object.keys(body["basicInfo"]):[]
    const customer = {
        basicInfo:{}
        // personalityInfo:{},
    }
    fields.forEach(field => {
        if(field === "spokenLanguages"){
            // console.log("skipping", field)
            customer["basicInfo"][field] = body["basicInfo"][field]
            return
        }
        customer["basicInfo"][field] = Array.isArray(body["basicInfo"][field]) ? body["basicInfo"][field][0] : body["basicInfo"][field]
        customer["basicInfo"][field] = customer["basicInfo"][field] === undefined || 
        customer["basicInfo"][field] === "" ? 
            (customerDefaultValues["basicInfo"][field]?customerDefaultValues["basicInfo"][field]:"" ): customer["basicInfo"][field]
    })
    
    customer["personalityInfo"] = body["personalityInfo"]?body["personalityInfo"]:customerDefaultValues["personalityInfo"]
    customer["photos"] = body["photos"]?body["photos"]:customerDefaultValues["photos"]
    return customer

}