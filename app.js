var fs = require('fs');

const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/primata.bazei.com.br/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/primata.bazei.com.br/cert.pem'),
};

var app = require('https').createServer(options, response).listen(3001);

var io = require('socket.io')(app);



var usuarios = [];
var ultimas_mensagens = [];

//app.createServer(options, response).listen(3001);
//app.createServer(response).listen(3001);
//app.listen(3001)
console.log("App it's running...");


function response (req, res) {
    var file = "";
    if (req.url == "/") {
        file =__dirname + '/index.html';
    } else {
        file =__dirname+req.url;
    }
    fs.readFile(file,
    function (err, data) {
        if (err) {
            res.writeHead(404);
            console.log(err);
            return res.end('Pagina ou arquivo nao encontrada');
            }
        res.writeHead(200);
        res.end(data);
    })
}

io.on("connection", function(socket) {
    socket.on("entrar", function(name, callback){
    if (name !== '') {
        if(!(name in usuarios)) {
            socket.name = name;
            usuarios[name] = socket;

            for(indice in ultimas_mensagens) {
                socket.emit("atualizar mensagens", ultimas_mensagens[indice]);
            }

            var mensagem = "[ " + pegarDataAtual() + " ] " + name + " acabou de entrar na sala";
            var obj_mensagem = {msg: mensagem, tipo: 'sistema'};

            io.sockets.emit("atualizar usuarios", Object.keys(usuarios));
            io.sockets.emit("atualizar mensagens", obj_mensagem);

            armazenaMensagem(obj_mensagem);
            
            callback(true);
        } else {
            callback(false);
        }
    }
    })

    socket.on("enviar mensagem", function(dados, callback) {

        var mensagem_enviada = dados.msg;
        var usuario = dados.usu;

        if (mensagem_enviada !== '') {

            if(usuario == null) {
                usuario = '';
            }
            
            mensagem_enviada = " [ " + pegarDataAtual() + " ]:" + socket.name + " diz: " + mensagem_enviada;
            console.log(mensagem_enviada);
            var obj_mensagem = {msg: mensagem_enviada, tipo: ''};
        
            if (usuario == '') {
                io.sockets.emit("atualizar mensagens", obj_mensagem);
                armazenaMensagem(obj_mensagem);
            } else {
                obj_mensagem.tipo = 'privada'
                socket.emit("atualizar mensagens", obj_mensagem);
                usuarios[usuario].emit("atualizar mensagens", obj_mensagem)
            }
            callback();
    }
    });

    socket.on("disconnect", function(){
        delete usuarios[socket.name];
        var mensagem = "[ " + pegarDataAtual() + " ] " + socket.name + " saiu da sala";
        var obj_mensagem = {msg: mensagem, tipo: 'sistema'}; 
        io.sockets.emit("atualizar usuarios", Object.keys(usuarios));
        io.sockets.emit("atualizar mensagens", obj_mensagem);

        armazenaMensagem(obj_mensagem);
    })
})

function pegarDataAtual() {
    var dataAtual = new Date();
    var dia = (dataAtual.getDate()<10 ? '0' : '') + dataAtual.getDate();
    var mes = ((dataAtual.getMonth() + 1)<10 ? '0' : '') + (dataAtual.getMonth() + 1);
    var ano = dataAtual.getFullYear();
    var hora = (dataAtual.getHours()<10 ? '0' : '') + dataAtual.getHours();
    var minuto = (dataAtual.getMinutes()<10 ? '0' : '') + dataAtual.getMinutes();
    var segundo = (dataAtual.getSeconds()<10 ? '0' : '') + dataAtual.getSeconds();
  
    var dataFormatada = dia + "/" + mes + "/" + ano + " " + hora + ":" + minuto + ":" + segundo;
    return dataFormatada;
}

function armazenaMensagem(mensagem) {
    if (ultimas_mensagens.length > 5) {
        ultimas_mensagens.shift();
    }

    ultimas_mensagens.push(mensagem);
}

