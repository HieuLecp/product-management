module.exports.priceNewProducts= (products) => {
    const newproducts = products.map(item => {
        item.priceNew = (item.price * (100-item.discountPercentage)/100).toFixed(0);
        return item
    })

    return newproducts;
}

module.exports.priceNewProduct= (products) => {
    products.priceNew= (products.price * (100-products.discountPercentage)/100).toFixed(0);

    return products;
}