const express = require("express");
const fs=require("fs");
const sharp=require("sharp");
const {Client} =require("pg");

const client = new Client({
    database: "postgres",
    user: "postgres",
    password: "postgres",
    host: "localhost",
    port: 5432,
});
client.connect();


app = express();

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"))
app.get(["/","/index", "/home"], function (req, res) {
    res.render("pagini/index.ejs",{ip:req.ip,imagini:obImagini.imagini});
}
)

app.get("/*.ejs",function(req,res){
    randeazaEroare(res,403)
})

app.get("/produse",function(req,res){
    client.query("select * from carti ",function(err,rezQuery){
        res.render("pagini/produse",{produse:rezQuery.rows})
    }); 
})

app.get("/produs/:id",function(req,res){
    client.query("select * from carti where id="+id,function(err,rezQuery){
        res.render("pagini/produs",{prod:rezQuery[0]})
    });

})

app.get("/*", function (req, res) {
    res.render("pagini" + req.url, function (err, rezRender) {
        if (err) {
            if (err.message.includes("Failed to lookup view")) {
                randeazaEroare(res,404)
            }
            else {
                res.render("pagini/eroare_generala");
            }
        }
        else {
            res.send(rezRender);
        }
    });

    res.end();
})

function creeazaImagini(){
    var buf=fs.readFileSync(__dirname+"/resurse/json/galerie.json").toString("utf8");
    obImagini=JSON.parse(buf);//global
    //console.log(obImagini);
    for (let imag of obImagini.imagini){
        let nume_imag, extensie;
        [nume_imag, extensie ]=imag.cale_fisier.split(".")// "abc.de".split(".") ---> ["abc","de"]
        let dim_mic=150
        
        imag.mic=`${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
        imag.mare=`${obImagini.cale_galerie}/${imag.cale_fisier}`;

        if (!fs.existsSync(imag.mic)){
            sharp(__dirname+"/"+imag.mare).resize(dim_mic).toFile(__dirname+"/"+imag.mic);
        }

        let dim_mediu=300
        imag.mediu=`${obImagini.cale_galerie}/mediu/${nume_imag}-${dim_mediu}.png` 
        if (!fs.existsSync(imag.mediu)){
            sharp(__dirname+"/"+imag.mare).resize(dim_mediu).toFile(__dirname+"/"+imag.mediu);
        }
    }

}

creeazaImagini();

function alege_imagini(){

    var anotimp_luni=["iarna","iarna","primavara","primavara","primavara","vara","vara","vara","toamna","toamna","toamna","iarna"]
    var numar_maxim_imagini=10;
    obImagini.imagini_selectate=[];

    //anotimpul curent
    const d=new Date();
    let luna=d.getMonth();
    let anotimp=anotimp_luni[luna]
    
    for (let imag of obImagini.imagini){
        if(imag.anotimp==anotimp){
            obImagini.imagini_selectate.push(imag);
            
            //Daca au fost selectate numarul maxim de imagini, break
            if(obImagini.imagini_selectate.length==numar_maxim_imagini)
                break;
        }

    }
}

alege_imagini();

function creeazaErori(){
    var buf=fs.readFileSync(__dirname+"/resurse/json/erori.json").toString("utf8");
    obErori=JSON.parse(buf);//global
}

creeazaErori();

function randeazaEroare(res,identificator,titlu,text,imagine){
    var eroare=obErori.erori.find(function (elem){return elem.identificator==identificator})
    titlu= titlu || (eroare  && eroare.titlu) || "Titlu custom eroare"
    text= text|| (eroare  && eroare.text) || "Titlu custom eroare"
    imagine= imagine|| (eroare  && (obErori.cale_baza+"/"+eroare.imagine)) || "resurse/img/interzis.png"
    if(eroare && eroare.status)
        res.status(eroare.identificator).render("pagini/eroare_generala", {titlu:titlu,text:text,imagine:imagine})
    else
        res.render("pagini/eroare_generala", {titlu:titlu,text:text,imagine:imagine})
}

app.listen(8080);