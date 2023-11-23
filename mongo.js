const mongoose = require('mongoose');

const mongoDBURI = 'mongodb+srv://Daniel:O6WesTOfjUlZLpEy@cluster0.uykics1.mongodb.net/';

//  Definiendo el esquema del usuario
const usuarioSchema = new mongoose.Schema({
    nombre: String,
    password: String
});

// Creando el modelo
const Usuario = mongoose.model('Usuario', usuarioSchema);


// Función de conexión a la base de datos.

const conectarDB = async () => {
    try {
        await mongoose.connect(mongoDBURI, {useNewUrlParser: true, useUnifiedTopology: true});
        console.log('Conectado a MongoDB');
    }catch (err){
        console.error('Error al conectar a MongoDB:'. err);
        process.exit(1); //Detiene la aplicación en caso de error.
    }
};
module.exports = { Usuario, conectarDB };//Para poder usar el codigo de este fichero en el servidor.
