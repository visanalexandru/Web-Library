const express = require("express");
const fs=require("fs");
const sharp=require("sharp");
const {Client} =require("pg");
const ejs=require("ejs");
const sass=require("sass");
const { path } = require("express/lib/application");
const { exec } = require("child_process");
const formidable= require('formidable');
const crypto= require('crypto');
const session= require('express-session');

// const client = new Client({
//     database: "postgres",
//     user: "postgres",
//     password: "postgres",
//     host: "localhost",
//     port: 5432,
// });

const client = new Client({
    database: "d6h9d2e24cfre8",
    user: "iyblorsafdqvfd",
    password: "77b72db0fdb861d9f86da5cb4c5be06b807623cd355d421f22310ac00242a220",
    host: "ec2-34-197-84-74.compute-1.amazonaws.com",
    port: 5432,
    ssl: {
    	rejectUnauthorized: false
  	}
});
client.connect();

const obGlobal={obImagini:null,obErori:null,prodCateg:null};

function gasire_categorii(){
    client.query("select * from unnest(enum_range(null::categorie_carte))", function(err, rezCateg){
        prodCateg=rezCateg.rows;
    })
}

function gasire_autori(){
    client.query("select distinct autor from carti", function(err, rezCateg){
        prodAutori=rezCateg.rows;
    })
}

gasire_categorii();
gasire_autori();

app = express();

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"))
app.get(["/","/index", "/home"], function (req, res) {
    res.render("pagini/index.ejs",{ip:req.ip,imagini:obImagini.imagini,categorii_produse:prodCateg});
}
)

app.get("*/galerie_animata.css",function(req,res){
    var buf=fs.readFileSync(__dirname+"/resurse/css/galerie_animata.scss").toString("utf8");

    randomInt=(Math.floor(Math.random()*5)+3)*2;
    

    result=ejs.render(buf,{num_img:randomInt});


    var path_scss=__dirname+"/temp/galerie_animata.scss";
    fs.writeFileSync(path_scss,result);
    try{
        var compile_result=sass.compile(path_scss,{sourceMap:true}).css;
        var path_css=__dirname+"/temp/galerie_animata.css";
        fs.writeFileSync(path_css,compile_result);
        res.setHeader("Content-Type","text/css");
        res.sendFile(path_css);
    }
    catch(err){
        console.log(err);
        res.send("Eroare");
    }
})

//--------------------------------utilizatori-------------------------------------------
parolaServer="tehniciweb";
app.post("/inreg",function(req,res){
    var formular=new formidable.IncomingForm();
    formular.parse(req,function(err,campuriText,campuriFisier){
        console.log(campuriText);
        var parolaCriptata=crypto.scryptSync(campuriText.parola,parolaServer, 64).toString('hex');
        comandaInserare=`insert into utilizatori (username, nume, prenume, parola, email, culoare_chat) values ('${campuriText.username}','${campuriText.nume}', '${campuriText.prenume}', '${parolaCriptata}', '${campuriText.email}', '${campuriText.culoare_chat}' ) `;
        client.query(comandaInserare,function(err,rezInserare){
            if(err){
                console.log(err)
            }
        })
    });
})



app.get("/*.ejs",function(req,res){
    randeazaEroare(res,403)
})

app.get("/produse",function(req,res){
    client.query("select * from unnest(enum_range(null::categorie_varsta))", function(err, rezCateg){
        client.query("select id,nume,descriere,autor,numar_pagini,pret,categorie,taguri,in_stoc,imagine,varsta_recomandata,to_char(data_adaugare,'DD/MONTH/YYYY') as data_adaugare from carti ",function(err,rezQuery){
            res.render("pagini/produse",{produse:rezQuery.rows, optiuni:rezCateg.rows,categorii_produse:prodCateg,autori:prodAutori})
        });
    }) 
})

app.get("/produs/id/:id",function(req,res){
    client.query(`select nume,descriere,autor,numar_pagini,pret,categorie,taguri,in_stoc,imagine,varsta_recomandata,to_char(data_adaugare,'DD/MONTH/YYYY') as data_adaugare from carti where id= ${req.params.id}`,function(err,rezQuery){
        res.render("pagini/produs",{prod:rezQuery.rows[0],categorii_produse:prodCateg,autori:prodAutori})
    });

})

app.get("/produse/categorie/:categorie",function(req,res){
    client.query("select * from unnest(enum_range(null::categorie_varsta))", function(err, rezCateg){
        client.query(`select * from carti where categorie='${req.params.categorie}'`,function(err,rezQuery){
            res.render("pagini/produse",{produse:rezQuery.rows, optiuni:rezCateg.rows,categorii_produse:prodCateg,autori:prodAutori})
        });
    }) 

})


app.get("/*", function (req, res) {
    res.render("pagini" + req.url, {categorii_produse:prodCateg},function (err, rezRender) {
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


var s_port=process.env.PORT ||  8080;
app.listen(s_port);