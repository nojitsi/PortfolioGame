const projectRoot = process.cwd();

module.exports.renderGame = function (req, res) {
    res.sendFile(projectRoot + '/html/game.html');
}