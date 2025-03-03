const ProductCategory= require("../../models/product-category.model");
const createTree = require("../../helpers/createTree");


module.exports.category= async (req, res, next) => {
    
    let find={
        deleted: false,
    };

    const records = await ProductCategory.find(find);
    const layoutProductCategory= createTree.tree(records);

    res.locals.layoutProductCategory = layoutProductCategory;

    next();
}