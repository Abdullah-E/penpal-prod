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