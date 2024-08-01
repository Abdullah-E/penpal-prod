export const extendDateByMonth = (date, months) => {
    if(!date){
        date = new Date()
    }
    const now = new Date()
    let dateRes;
    if(date < now){
        dateRes = now.setMonth(now.getMonth() + months)
    }else{
        dateRes = date.setMonth(date.getMonth() + months)
    }
    return dateRes
}