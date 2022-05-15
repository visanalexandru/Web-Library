window.addEventListener("DOMContentLoaded",function(){
    checkBanner();
})

function setCookie(name,val,timpExp,path="/"){
    //timpExp in milisecunde
    d=new Date();
    d.setTime(d.getTime()+timpExp);
    document.cookie=`${name}=${val}; expires=${d.toUTCString()}; path=${path}`;
}


function getCookie(nume){
    var v_cookie=document.cookie.split(";");
    for(let c of v_cookie){
        c=c.trim();
        if(c.startsWith(nume+"=")){
            return c.substring(nume.length+1)
        }
    }
}

function deleteCookie(nume){
    setCookie(nume,"",0); 
}

function checkBanner(){
    if(getCookie("acceptat_banner")){
        document.getElementById("banner").style.display="none";
    }
    else{
        document.getElementById("banner").style.display="block";
        document.getElementById("ok_cookies").onclick=function(){
            setCookie("acceptat_banner","true",5000);
            document.getElementById("banner").style.display="none";
        };
    }
}

function deleteAllCookies(){
    var v_cookie=document.cookie.split(";");
    for(let c of v_cookie){
        c=c.trim();
        nume_cookie=c.split("=")[0];
        console.log(nume_cookie);
        deleteCookie(nume_cookie);
    }
}