export const extendDateByMonth = (date, months) => {
    const now = new Date()
    let dateRes;
    if(date < now){
        dateRes = now.setMonth(now.getMonth() + months)
    }else{
        dateRes = date.setMonth(date.getMonth() + months)
    }
    return dateRes
}