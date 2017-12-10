var Tab = require('../models').Tab;

exports.getCountByQuery = function (query, callback) {
    Tab.count(query, callback);
};

exports.getTabByQuery = function (query, opt, callback) {
    Tab.find(query, '', opt, callback);
};

exports.getTabById = function (id, callback) {
    Tab.findOne({_id: id}, callback);
};

exports.getTabByName = function (tabName, callback) {
    Tab.findOne({'name': new RegExp('^' + tabName + '$', "i")}, callback);
};

exports.removeByName = function (tabName, callback) {
    Tab.remove({'name': new RegExp('^' + tabName + '$', "i")}, callback);
};

exports.newAndSave = function (tabName, authorId, callback) {
    var tab = new Tab();
    tab.name = tabName;
    tab.author = authorId;
    tab.save(callback);
};