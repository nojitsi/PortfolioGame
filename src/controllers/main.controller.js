const projectRoot = process.cwd();

module.exports.showMainPage = function (req, res) {
    res.sendFile(projectRoot + '/html/home-page.html');
}