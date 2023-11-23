const express = require('express');
var fs = require('fs');
var cookieParser=require('cookie-parser');
var session = require('express-session');

// Rutas a tus archivos de certificado y clave privada||Esto es de Despliegue, que pisto.
const privateKey =fs.readFileSync('miclave.key', 'utf8');
const certificate = fs.readFileSync('micertificado.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate,
    passphrase: '123456' };
    /* var https = require ('https'); */
    


const mongoose = require('mongoose');
const {Usuario, conectarDB }  = require('./mongo');//Esto importa todo el fichero que hay en este fichero. No tiene porque llamarse conectarDB.

const app = express();
var server = require('http').Server(app);//|| Esto se ha comentado por la modificación hecha de despligue.
//var server = https.createServer(credentials, app);//Se pone debajo de app porque sino luego no la encuentra.
var port = process.env.PORT || 3002;//Cambio puerto clase de 20/11/2023 de despliegue. El puerto original es el 3000 y le pongo el 3001.
app.use(express.json());
app.use(express.static('public'));
app.use( session({
    secret: 'tu cadena secreta', // Agrega tu propia cadena secreta aquí
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Para desarrollo en localhost. En producción, deberías usar 'true'
}));
app.use(cookieParser('your secret here'));
var usuarios = cargarUsuarios();


//FUNCIONES
var auth = function(req, res, next){
    if(req.session && req.session.user === "admin" && req.session.admin){
        return next();
    }
    else{
        return res.sendStatus(401);
    }

}


//FUNCIONES GET

app.get('/', (req, response) => {
    var contenido=fs.readFileSync("public/index.html");
    response.setHeader("Content-type", "text/html");
    response.send(contenido);
});

app.get('/login', (req, response) => {
    var contenido=fs.readFileSync("public/login.html");
    response.setHeader("Content-type", "text/html");
    response.send(contenido);
});
app.get('/peticionMEDAC', (req, response) => {
    var contenido=fs.readFileSync("public/peticionMEDAC.html");
    response.setHeader("Content-type", "text/html");
    response.send(contenido);
});

app.get('/rutaSegura',auth, (req, response) => {
    var contenido=fs.readFileSync("public/logueado.html");
    response.setHeader("Content-type", "text/html");
    response.send(contenido);
});
app.get("/saluda", function(req, res){
    res.send("Hola mundo");
});
app.get('/registro', (req, response) => {
    var contenido=fs.readFileSync("public/register.html");
    response.setHeader("Content-type", "text/html");
    response.send(contenido);
});
app.get('/registrarNueva', (req, response) => {
    var contenido=fs.readFileSync("public/register.html");
    response.setHeader("Content-type", "text/html");
    response.send(contenido);
});    

//FUNCIONES POST
app.post('/identificar', function(req, res){
    if(!req.body.username || !req.body.password){
        res.send({"res":"login failed"});
    }
    else{
        const usuarioEncontrado = usuarios.find(usuario => 
            usuario.username == req.body.username && usuario.password == req.body.password
        );
    
       if (usuarioEncontrado) {
            req.session.user = "admin"; 
            req.session.admin = true; 
            return res.send({"res":"login true"});
        }
        else {
            res.send({"res":"usuario no valido"});
        }

    }
  
});

app.post('/identificarNuevo', async function(req, res){
    if(!req.body.username || !req.body.password){
        res.send({"res":"login failed"});
    }
    else{
        try {
        usuarioEncontrado = await Usuario.findOne({ nombre:req.body.username, password:req.body.password})
            
        }
        catch(err){
            console.error('Error al buscar al usuario.');
        }
    
       if (usuarioEncontrado) {
            req.session.user = "admin"; 
            req.session.admin = true; 
            return res.send({"res":"login true"});
        }
        else {
            res.send({"res":"usuario no valido"});
        }
    }
});

app.post('/registrar', function(req, res){
    //Compruebo si me han pasado bien los dos parametros
    if(!req.body.username || !req.body.password){
        //Si falta algun parametro envio la respuesta failed
        res.send({"res":"register failed"});
    }
    //Si estan bien los dos parametros, sigo con la creacion del usuario
    else  {
        //Creo una variable usuarioExiste con valor False, presuponiendo que no existe ese usuario
        let usuarioExiste = false;
        //Recorro el array de usuarios comprobando uno por uno si existe un usuario con el nombre que estoy
        //intentando crear. Si ya existe alguien con ese nombre, pongo la variable usuarioExiste a True
        for (let i = 0; i < usuarios.length; i++) {
            if (usuarios[i].username==req.body.username ){
                usuarioExiste=true;                
            }            
        }
        //En caso de que la variable usuarioExiste se haya puesto a true, quiere decir que ese usuario ya existia
        //en mi array, por lo cual no puedo volver a crearlo. Envio la respuesta "usuario ya existe"
        if (usuarioExiste){
            res.send({"res":"usuario ya existe"});
            //Si la variable usuarioExiste sigue siendo False, quiere decir que el usuario no existia previamente
            //Creo ese usuario y lo meto al array
        } else{
            //Creo el usuario con los datos recibidos por parametro
            var usuario= {
                username:req.body.username,
                password:req.body.password
            }
            //Guardo el usuario en mi array de usuarios
            usuarios.push(usuario);
            console.log(usuarios);
            //Siempre que modifico el array de usuarios, llamo a guardarUsuarios para que lo guarde en el fichero tambien
            guardarUsuarios(usuarios);
            res.send({"res":"register true"});

        }
        
    }

});

app.post('/registrarNueva', async function(req, res){
    //  Compruebo si me han pasado bien los dos parametros
    if(!req.body.username || !req.body.password){
        //Si falta algun parametro envio la respuesta failed
        res.send({"res":"register failed"});
    }

    //  Si estan bien los dos parámetros, sigo con la creación del usuario.
    else {
        //Compruebo si existe un usuario con ese nombre en la base de datos.
        try{
            usuarioExistente = await Usuario.findOne({ nombre: req.body.username});
        }
        catch (err){
            console.error('Error al crear usuario:', err)
        }
        if (usuarioExistente){
            console.log('Ya existe un usuario con ese nombre');
            res.send({"res":"usuario ya existe"});
        }
        else{
            //Creo el usuario con los datos recibidos por parametro en la base de datos
            const nuevoUsuario = new Usuario({
                nombre: req.body.username,
                password:req.body.password
            });
            try{
                nuevoUsuario.save();
                console.log('Nuevo usuario creado:', nuevoUsuario);
                res.send({"res":"register true"});
            }catch (err) {
                console.error('Error al crear usuario', err);
            }
        }
    }
});

//Esta función la hicimos el día 20/11/2023 en la clase de despliegue.
app.post('/error',function(req,res){
    process.exit(1);
});

//FUNCIONES DE LOGICA
function guardarUsuarios(usuarios) {
    // Serializar el array a JSON
    const json = JSON.stringify(usuarios);
    // Escribir en un archivo
    fs.writeFileSync('usuarios.json', json, 'utf8', function(err) {
      if (err) {
        console.log('Ha ocurrido un error al guardar los usuarios', err);
      } else {
        console.log('Usuarios guardados correctamente.');
      }
    });
  }
  function cargarUsuarios() {
    try {
      // Leer el archivo
      const data = fs.readFileSync('usuarios.json', 'utf8');
      // Deserializar el JSON a un objeto JavaScript
      console.log("#######USUARIOS CARGADOS##############");
      console.log(JSON.parse(data));
      return JSON.parse(data);
    } catch (err) {
      // Si hay un error al leer el archivo, por ejemplo, porque no existe, devolver un array vacío
      console.log('Error al leer los usuarios desde el archivo:', err);
      return [];
    }
  }
  
conectarDB();
//FUNCION MAIN DEL SERVIDOR
server.listen(port, () => {
  console.log('App listening on port 3000');
});