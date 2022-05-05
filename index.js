const express = require("express");
const fs = require("fs");
const sharp = require("sharp");
const { Client } = require("pg");
const ejs = require("ejs");
const sass = require("sass");
const  path  = require("path");
const { exec } = require("child_process");
const formidable = require('formidable');
const crypto = require('crypto');
const session = require('express-session');
const { query } = require("express");
const req = require("express/lib/request");
const res = require("express/lib/response");
const nodemailer = require("nodemailer");
const { escapeRegExpChars } = require("ejs/lib/utils");

const obGlobal = {
    obImagini: null,
    obErori: null,
    prodCateg: null,
    sirAlphaNum: "",
    protocol: null,
    numeDomeniu: null,
    emailServer: "lweb16976@gmail.com"
};


if(process.env.SITE_ONLINE){
    obGlobal.protocol="https://";
    obGlobal.numeDomeniu="proiect-html.herokuapp.com"

    client = new Client({
        database: "d6h9d2e24cfre8",
        user: "iyblorsafdqvfd",
        password: "77b72db0fdb861d9f86da5cb4c5be06b807623cd355d421f22310ac00242a220",
        host: "ec2-34-197-84-74.compute-1.amazonaws.com",
        port: 5432,
        ssl: {
            rejectUnauthorized: false
          }
    }); 
}
else{
    obGlobal.protocol="http://";
    obGlobal.numeDomeniu="localhost:8080";

    client = new Client({
        database: "postgres",
        user: "postgres",
        password: "postgres",
        host: "localhost",
        port: 5432,
    });
}
client.connect();
foldere=["temp","poze_uploadate"];
for(let folder of foldere){
    let cale_folder=path.join(__dirname,folder);
    if(!fs.existsSync(cale_folder)){
        fs.mkdirSync(cale_folder);
    }
}

async function trimiteMail(email, subiect, mesajText, mesajHtml, atasamente = []) {
    var transp = nodemailer.createTransport({
        service: "gmail",
        secure: false,
        auth: {//date login 
            user: obGlobal.emailServer,
            pass: "gkzfjmycbavnvjni"
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    //genereaza html
    await transp.sendMail({
        from: obGlobal.emailServer,
        to: email,
        subject: subiect,//"Te-ai inregistrat cu succes",
        text: mesajText, //"Username-ul tau este "+username
        html: mesajHtml,// `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${username}.</p> <p><a href='http://${numeDomeniu}/cod/${username}/${token}'>Click aici pentru confirmare</a></p>`,
        attachments: atasamente
    })
    console.log("trimis mail");
}



var v_intervale = [[48, 57], [65, 90], [97, 122]];

for (let interval of v_intervale) {
    for (let i = interval[0]; i <= interval[1]; i++) {
        obGlobal.sirAlphaNum += String.fromCharCode(i);
    }
}

function genereazaToken(n) {
    let token = "";
    for (let i = 0; i < n; i++) {
        token += obGlobal.sirAlphaNum[Math.floor(Math.random() * obGlobal.sirAlphaNum.length)]
    }
    return token;
}


function gasire_categorii() {
    client.query("select * from unnest(enum_range(null::categorie_carte))", function (err, rezCateg) {
        prodCateg = rezCateg.rows;
    })
}

function gasire_autori() {
    client.query("select distinct autor from carti", function (err, rezCateg) {
        prodAutori = rezCateg.rows;
    })
}

function gasire_preturi() {
    client.query("select min(pret),max(pret) from carti", function (err, rezCateg) {
        prodMinPret = Math.floor(rezCateg.rows[0]["min"]);
        prodMaxPret = Math.ceil(rezCateg.rows[0]["max"]);
    })
}

gasire_categorii();
gasire_autori();
gasire_preturi();

app = express();

app.use(session( //aici se creeaza proprietatea session a requestului
    {
        secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
        resave: true,
        saveUninitialized: false
    }
))

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"))
app.use("/poze_uploadate", express.static(__dirname + "/poze_uploadate"))

app.use("/*", function (req, res, next) {
    res.locals.utilizator = req.session.utilizator;
    res.locals.categorii_produse = prodCateg;
    res.locals.mesajLogin=req.session.mesajLogin;
    req.session.mesajLogin=null;
    next();
})


app.get(["/", "/index", "/home"], function (req, res) {
    res.render("pagini/index.ejs", { ip: req.ip, imagini: obImagini.imagini });
}
)

app.get("*/galerie_animata.css", function (req, res) {
    var buf = fs.readFileSync(__dirname + "/resurse/css/galerie_animata.scss").toString("utf8");

    randomInt = (Math.floor(Math.random() * 5) + 3) * 2;


    result = ejs.render(buf, { num_img: randomInt });

    if (!fs.existsSync(__dirname + "/temp")) {
        fs.mkdirSync(__dirname + "/temp");
    }

    var path_scss = __dirname + "/temp/galerie_animata.scss";
    fs.writeFileSync(path_scss, result);
    try {
        var compile_result = sass.compile(path_scss, { sourceMap: true }).css;
        var path_css = __dirname + "/temp/galerie_animata.css";
        fs.writeFileSync(path_css, compile_result);
        res.setHeader("Content-Type", "text/css");
        res.sendFile(path_css);
    }
    catch (err) {
        console.log(err);
        res.send("Eroare");
    }
})
//--------------------------------utilizatori-------------------------------------------
parolaServer="tehniciweb";
app.post("/inreg",function(req, res){
    console.log("ceva");
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier ){
        console.log(campuriText);

        var eroare="";
        if(campuriText.username==""){
            eroare+="Username necompletat. ";
        }

        if(campuriText.username.length>20){
            eroare+="Username prea mare. ";
        }

        if(campuriText.nume==""){
            eroare+="Nume necompletat. ";
        }
        if(campuriText.nume.length>20){
            eroare+="Nume prea mare. ";
        }

        if(campuriText.prenume==""){
            eroare+="Prenume necompletat. ";
        }

        if(campuriText.prenume.length>20){
            eroare+="Nume prea mare. ";
        }

        if(campuriText.parola==""){
            eroare+="Parola necompletata. ";
        }

        if(campuriText.parola.length>20){
            eroare+="Parola prea mare. ";
        }

        if(campuriText.email==""){
            eroare+="Email necompletat. ";
        }

        if(campuriText.email.length>100){
            eroare+="Email prea mare. ";
        }

        if(!campuriText.username.match(new RegExp("^[A-Za-z0-9]+$"))){
            eroare+="Username nu corespunde patternului. ";
        }

        if(!campuriText.nume.match(new RegExp("^[A-Z][a-z]+$"))){
            eroare+="Numele nu corespunde patternului. ";
        }

        if(!campuriText.prenume.match(new RegExp("^[A-Z][a-z]+$"))){
            eroare+="Prenumele nu corespunde patternului. ";
        }

        if(!campuriText.email.match(new RegExp("^[a-z0-9_-]+@[a-z0-9]+\\.[a-z]{2,3}$"))){
            eroare+="Mail-ul nu corespunde patternului. ";
        }
        if(!eroare){
            queryUtiliz=`select username from utilizatori where username='${campuriText.username}'`;
            client.query(queryUtiliz, function(err, rezUtiliz){
                if (rezUtiliz.rows.length!=0){
                    eroare+="Username-ul mai exista. ";
                    res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
                }
                else{
                    var parolaCriptata=crypto.scryptSync(campuriText.parola,parolaServer, 64).toString('hex');
                    let token=genereazaToken(100);
                    var comandaInserare=`insert into utilizatori (username, nume, prenume, parola, email, culoare_chat, cod) values ('${campuriText.username}','${campuriText.nume}', '${campuriText.prenume}', '${parolaCriptata}', '${campuriText.email}', '${campuriText.culoare_chat}' ,'${token}') `;
                    client.query(comandaInserare, function(err, rezInserare){
                        if(err){
                            console.log(err);
                            res.render("pagini/inregistrare", {err: "Eroare baza de date"});
                        }
                        else{
                            res.render("pagini/inregistrare", {raspuns: "Datele au fost introduse"});
                            let linkConfirmare=obGlobal.protocol+obGlobal.numeDomeniu+"/cod/"+token;
                            trimiteMail(campuriText.email, `Bună, ${campuriText.nume}`, "text",`<h1 style='background-color:lightblue'>Bine ai venit!</h1>
                                                        <p>Username-ul tau este ${campuriText.username}.</p>
                                                        <a href='${linkConfirmare}'>Confirma contul</a>`);
                        }
                    });
                    
                }
            })
        }
        else
            res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
    })
});


app.get("/cod/:token",function(req, res){
    let comandaUpdate=`update utilizatori set confirmat_mail=true where cod='${req.params.token}'`;
    client.query(comandaUpdate,function(err, rezUpdate){
        if(err){
            console.log(err);
            randeazaEroare(res, 2);
        }
        else{
            if (rezUpdate.rowCount>0){
                res.render("pagini/confirmare");
            }
            else{
                randeazaEroare(res, -1,"Email neconfirmat","Incercati iar", null);
            }
        }
    } )
});


app.post("/login", function (req, res) {
    var formular = new formidable.IncomingForm();
    formular.parse(req, function (err, campuriText, campuriFisier) {

        console.log(campuriText);
        var parolaCriptata = crypto.scryptSync(campuriText.parola, parolaServer, 64).toString('hex');
        var querySelect = `select * from utilizatori where username='${campuriText.username}' and parola='${parolaCriptata}' and confirmat_mail=true`;

        client.query(querySelect, function (err, rezSelect) {
            if (err) {
                console.log(err);
            }
            else {
                console.log(rezSelect.rows);
                if (rezSelect.rows.length == 1) { //Daca am utilizatorul si a dat credentiale corecte
                    req.session.utilizator = {
                        nume: rezSelect.rows[0].nume,
                        prenume: rezSelect.rows[0].prenume,
                        username: rezSelect.rows[0].username,
                        email: rezSelect.rows[0].email,
                        culoare_chat: rezSelect.rows[0].culoare_chat,
                        rol: rezSelect.rows[0].rol,
                    }
                    res.redirect("/index");
                }
                else {
                    //randeazaEroare(res, -1, "Login esuat", "Mail neconfirmat sau parola gresita");
                    req.session.mesajLogin="Login esuat";
                    res.redirect("/index")
                    
                }
            }
        })

    })
})

// ---------------- Update profil 
app.post("/profil", function(req, res){
    console.log("profil");
    if (!req.session.utilizator){
        res.render("pagini/eroare_generala",{text:"Nu sunteti logat."});
        return;
    }
    var formular= new formidable.IncomingForm();
 
    formular.parse(req,function(err, campuriText, campuriFile){
       
        var criptareParola=crypto.scryptSync(campuriText.parola,parolaServer, 64).toString('hex');
 
        //TO DO query
        var queryUpdate=`update utilizatori set username='${campuriText.username}', nume='${campuriText.nume}',prenume='${campuriText.prenume}', email='${campuriText.email}', culoare_chat='${campuriText.culoare_chat}'  where parola='${criptareParola}'`;
        console.log(queryUpdate);
       
        client.query(queryUpdate,  function(err, rez){
            if(err){
                console.log(err);
                res.render("pagini/eroare_generala",{text:"Eroare baza date. Incercati mai tarziu."});
                return;
            }
            console.log(rez.rowCount);
            if (rez.rowCount==0){
                res.render("pagini/profil",{mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                return;
            }
            else{
                req.session.utilizator.nume=campuriText.nume;
                req.session.utilizator.prenume=campuriText.prenume;
                req.session.utilizator.email=campuriText.email;
                req.session.utilizator.culoare_chat=campuriText.culoare_chat;
            }
           
            //TO DO actualizare sesiune
 
            res.render("pagini/profil",{mesaj:"Update-ul s-a realizat cu succes."});
 
        });
       
 
    });
});


app.get("/logout", function (req, res) {
    req.session.destroy();
    res.locals.utilizator = null;
    res.render("pagini/logout");
})

app.get("/*.ejs", function (req, res) {
    randeazaEroare(res, 403)
})

app.get("/produse", function (req, res) {
    client.query("select * from unnest(enum_range(null::categorie_varsta))", function (err, rezCateg) {
        client.query("select id,nume,descriere,autor,numar_pagini,pret,categorie,taguri,in_stoc,imagine,varsta_recomandata,to_char(data_adaugare,'DD/MONTH/YYYY') as data_adaugare from carti ", function (err, rezQuery) {
            res.render("pagini/produse", { produse: rezQuery.rows, optiuni: rezCateg.rows, autori: prodAutori, pretRange: [prodMinPret, prodMaxPret] })
        });
    })
})

app.get("/produs/id/:id", function (req, res) {
    client.query(`select nume,descriere,autor,numar_pagini,pret,categorie,taguri,in_stoc,imagine,varsta_recomandata,to_char(data_adaugare,'DD/MONTH/YYYY') as data_adaugare from carti where id= ${req.params.id}`, function (err, rezQuery) {
        res.render("pagini/produs", { prod: rezQuery.rows[0], autori: prodAutori })
    });

})

app.get("/produse/categorie/:categorie", function (req, res) {
    client.query("select * from unnest(enum_range(null::categorie_varsta))", function (err, rezCateg) {
        client.query(`select * from carti where categorie='${req.params.categorie}'`, function (err, rezQuery) {
            res.render("pagini/produse", { produse: rezQuery.rows, optiuni: rezCateg.rows, autori: prodAutori, pretRange: [prodMinPret, prodMaxPret] })
        });
    })
})


app.get("/*", function (req, res) {
    res.render("pagini" + req.url, { categorii_produse: prodCateg }, function (err, rezRender) {
        if (err) {
            if (err.message.includes("Failed to lookup view")) {
                randeazaEroare(res, 404)
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

function creeazaImagini() {
    var buf = fs.readFileSync(__dirname + "/resurse/json/galerie.json").toString("utf8");
    obImagini = JSON.parse(buf);//global
    //console.log(obImagini);
    for (let imag of obImagini.imagini) {
        let nume_imag, extensie;
        [nume_imag, extensie] = imag.cale_fisier.split(".")// "abc.de".split(".") ---> ["abc","de"]
        let dim_mic = 150

        imag.mic = `${obImagini.cale_galerie}/mic/${nume_imag}-${dim_mic}.webp` //nume-150.webp // "a10" b=10 "a"+b `a${b}`
        imag.mare = `${obImagini.cale_galerie}/${imag.cale_fisier}`;

        if (!fs.existsSync(imag.mic)) {
            sharp(__dirname + "/" + imag.mare).resize(dim_mic).toFile(__dirname + "/" + imag.mic);
        }

        let dim_mediu = 300
        imag.mediu = `${obImagini.cale_galerie}/mediu/${nume_imag}-${dim_mediu}.png`
        if (!fs.existsSync(imag.mediu)) {
            sharp(__dirname + "/" + imag.mare).resize(dim_mediu).toFile(__dirname + "/" + imag.mediu);
        }
    }

}

creeazaImagini();

function alege_imagini() {

    var anotimp_luni = ["iarna", "iarna", "primavara", "primavara", "primavara", "vara", "vara", "vara", "toamna", "toamna", "toamna", "iarna"]
    var numar_maxim_imagini = 10;
    obImagini.imagini_selectate = [];

    //anotimpul curent
    const d = new Date();
    let luna = d.getMonth();
    let anotimp = anotimp_luni[luna]

    for (let imag of obImagini.imagini) {
        if (imag.anotimp == anotimp) {
            obImagini.imagini_selectate.push(imag);

            //Daca au fost selectate numarul maxim de imagini, break
            if (obImagini.imagini_selectate.length == numar_maxim_imagini)
                break;
        }

    }
}

alege_imagini();

function creeazaErori() {
    var buf = fs.readFileSync(__dirname + "/resurse/json/erori.json").toString("utf8");
    obErori = JSON.parse(buf);//global
}

creeazaErori();

function randeazaEroare(res, identificator, titlu, text, imagine) {
    var eroare = obErori.erori.find(function (elem) { return elem.identificator == identificator })
    titlu = titlu || (eroare && eroare.titlu) || "Titlu custom eroare"
    text = text || (eroare && eroare.text) || "Titlu custom eroare"
    imagine = imagine || (eroare && (obErori.cale_baza + "/" + eroare.imagine)) || "resurse/img/interzis.png"
    if (eroare && eroare.status)
        res.status(eroare.identificator).render("pagini/eroare_generala", { titlu: titlu, text: text, imagine: imagine })
    else
        res.render("pagini/eroare_generala", { titlu: titlu, text: text, imagine: imagine })
}


var s_port = process.env.PORT || 8080;
app.listen(s_port);