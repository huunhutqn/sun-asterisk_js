//declare/initialize variales
const dbUrl = "http://localhost:3000/";
/// home page
const productHighlight = document.getElementById("home__pr-highlight");
const productHot = document.getElementById("home__pr-hot");
const productNew = document.getElementById("home__pr-new");
const productPromo = document.getElementById("home__pr-promo");
/// product detail page
const productDetail = document.getElementById("product-detail");
/// cart page
const productCart = document.getElementById("cart__bought__form__body");
const cartTotalNoneVat = document.getElementById("total-none-vat");
const cartTotalHasVat = document.getElementById("total-has-vat");
const cartTotal = document.getElementById("total-final");
/// checkout page
const checkoutShowProducts = document.getElementById('checkout__product-in-cart__products');

//declare products database variable
let dbPrHighlight = [], // database sản phẩm nổi bật
    dbPrHot = [], // databse sản phẩm mua nhiều
    dbPrPromo = [], // database sản phẩm khuyến mại
    dbPrNew = [], // database sản phẩm mới
    dbPrLabel = [], // database nhãn sản phẩm(mới, % giảm giá)
    dbPrDetail = [], // database chi tiết sản phẩm nào đó
    dbPrInCart = [],
    dbProducts; // database products

// declare variales for local storage
let cartLocalStorage,
    quantity,
    buyNowIs = false;

// declare variales for local storage
let total = 0, vat = 0, noneVat = 0;

//declare variables for properties of product
let count = 0,
    itemId,
    itemImg,
    itemLabel,
    itemLink,
    itemName,
    itemRating,
    itemPromo_price,
    itemPrice,
    itemLong_desc,
    itemFull_desc,
    itemCategory,
    itemGallery;

// declare variables for her
let strTmp = "",
    numTmp = 0;

// onload website
countProductInCart('pages');

// load label
function getProductLabel() {
  makeRequest(dbUrl + 'product-label', 'GET', {})
    .then(function(result) {
      return dbPrLabel = result;
    })
    .catch(function() {
      return console.log('lỗi lấy pr label rồi');
  });
}

// load product
/// check load all or only
const pagePath = window.location.pathname;
getUrlParameter = url => {
  let pageUrlHasParameter = window.location.href;
  let parameter = pageUrlHasParameter.replace(url,"");
  let slugItem = parameter.replace("?product=","");
  parameter = '?link_like=^' + slugItem + '$';
  return parameter;
};

switch (pagePath) {
  case '/product-detail.html':
    let pageUrl = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + pagePath;
    // getUrlParameter(pageUrl);
    // *** cần chức năng điều hướng hoặc báo lỗi nếu không có parameter(không có sản phẩm)
    makeRequest(dbUrl + 'products' + getUrlParameter(pageUrl), 'GET', {})
      .then(function(result) {
        return handleProductDetail(result, printProductDetail);
      })
      .catch(function() {
        return console.log('lỗi lấy pr detail rồi');
    });
    break;
  case '/cart.html':
    handleProductCart();
    break;
  default:
    getProductLabel();
    makeRequest(dbUrl + 'products', 'GET', {})
      .then(function(result) {
        return handleProduct(result, printProduct);
      })
      .catch(function() {
        return console.log('lỗi lấy pr rồi');
    });
    break;
}
// let products = makeRequest('http://localhost:3000/products', 'GET', {});

// handle json product cart and show(render to html)
/// handle product in cart
function handleProductCart () {
  total = 0;
  vat = 0;
  noneVat = 0;
  let idProductInCart = '';
  cartLocalStorage = JSON.parse(localStorage.getItem('cart'));
  // can link co id de lay sp
  for (const product of cartLocalStorage) {
    idProductInCart += '&id=' + product.id;
  }
  // get data & print out
  getProductToCart(idProductInCart, printProductCart);
  countProductInCart('pages');
}
function getProductToCart(idProductInCart, cFunction) {
  makeRequest(dbUrl + 'products?' + idProductInCart, 'GET', {})
    .then(function(result) {
      return cFunction(result);
    })
    .catch(function() {
      return false;
  });
}
function printProductCart(data) {
  dbPrInCart = data;
  for (const product of dbPrInCart) {
    if (cartLocalStorage.length == 0) {
      break;
    }
    productCart.insertAdjacentHTML('beforeend', layoutProductCart(product));
  }
  totalCart('onLoad',noneVat);
  // cartTotalNoneVat.innerHTML = convertPrice((total*1000)) + ' đ';
  // cartTotalHasVat.innerHTML = convertPrice(((total*1000*10)/100)) + ' đ';
  // cartTotal.innerHTML = convertPrice((total*1000 + (total*1000*10)/100)) + ' đ';
}
function layoutProductCart(product) {
  itemId = product.id;
  itemImg = product.img;
  itemLink = product.link;
  itemName = product.name;
  itemPromo_price = product.promo_price;
  noneVat += countProductInCart(itemId)*itemPromo_price;
  return `
    <tr class="cart__bought__form__table__item" data-id="${itemId}">
      <td class="cart__bought__form__table__item__image"><a href="product-detail.html?product=${itemLink}"><img src="../../images/sp/${itemImg}"/></a></td>
      <td class="uppercase cart__bought__form__table__item__name"><a href="product-detail.html?product=${itemLink}">${itemName}</a></td>
      <td class="cart__bought__form__table__item__price"><span>${convertPrice(itemPromo_price)}.000 đ</span></td>
      <td class="cart__bought__form__table__item__amount">
        <input type="number" value="${countProductInCart(itemId)}" step="1"/>
      </td>
      <td class="cart__bought__form__table__item__total"><span>${convertPrice(countProductInCart(itemId)*itemPromo_price)}.000 đ</span></td>
      <td class="cart__bought__form__table__item__icon"><a class="cart__bought__form__table__item__trash-icon" onClick="deleteProductInCart(this);"><i class="fa fa-trash" aria-hidden="true"></i></a></td>
    </tr>
  `;
}
function countProductInCart(itemId) {
  let count = 0;
  let checkoutProduct = document.getElementById("checkout__product-in-cart");
  if (itemId == 'pages') {
    cartLocalStorage = JSON.parse(localStorage.getItem('cart'));
    if (cartLocalStorage == null) {
      document.getElementById('header__top__mid__right__below__cart__total').innerHTML = 0;
      if (checkoutProduct != null) {
        checkoutProduct.innerHTML = 0;
      }
      return false;
    }
    if (cartLocalStorage.length == 0) {
      document.getElementById('header__top__mid__right__below__cart__total').innerHTML = 0;
      if (checkoutProduct != null) {
        checkoutProduct.innerHTML = 0;
      }
      return false;
    } else {
      cartLocalStorage.map(function(product) {
        count += product.quantity;
      });
      document.getElementById('header__top__mid__right__below__cart__total').innerHTML = count;
      if (checkoutProduct != null) {
        checkoutProduct.innerHTML = count;
      }
    }
  } else {
    cartLocalStorage.map(function(product) {
      if (itemId == product.id) {
        count = product.quantity;
      }
    });
  }
  // if(count == 0) console.log('Loi roi, dem khong co ra');
  return count;
}
// detele product in cart
deleteProductInCart = e => {
  // e: element clicked
  let product = e.closest('.cart__bought__form__table__item');
  itemId = e.closest('.cart__bought__form__table__item').getAttribute('data-id');
  for (const key in cartLocalStorage) {
    if (itemId == cartLocalStorage[key].id) {
      cartLocalStorage.splice(key, 1);
      // ** another way to remove element
      // let productParent = product.closest('#cart__bought__form__body');
      // let productParent_arr = productParent.querySelectorAll('.cart__bought__form__table__item');
      // for (const key in productParent_arr) {
      //   if (!isNaN(key)) {
      //     if (itemId == productParent_arr[key].getAttribute('data-id')) {
      //       productParent_arr[key].remove();
      //     }
      //   }
      // }
      product.remove();
      localStorage.setItem('cart', JSON.stringify(cartLocalStorage));
      totalCart('onDelete',0);
      break;
    }
  }
  countProductInCart('pages');
};
// update total when delete
function totalCart(forWhat, price) {
  noneVat = 0;
  vat = 0;
  total = 0;
  let eHTML;
  switch (forWhat) {
    case 'onLoad':
      price *= 1000; // avoid vat is ugly and hard to convert
      cartTotalNoneVat.innerHTML = convertPrice(price) + ' đ';
      cartTotalHasVat.innerHTML = convertPrice(price*10/100) + ' đ';
      cartTotal.innerHTML = convertPrice(price+(price*10/100)) + ' đ';
      break;
    case 'onDelete':
      let data = JSON.parse(localStorage.getItem('cart'));
      strTmp = '';
      for (const product of data) {
        // tao string get all product left in cart
        strTmp += '&id=' + product.id;
      }
      makeRequest(dbUrl + 'products?' + strTmp, 'GET', {})
        .then(function(result) {
          for (const product of data) {
            for (const productOnServer of result) {
              if (product.id == productOnServer.id) {
                numTmp = 0;
                // console.log('hura ' + product.quantity +'*'+ productOnServer.promo_price+'='+ (product.quantity * productOnServer.promo_price));
                // console.log((noneVat + (product.quantity * productOnServer.promo_price)) + '=' + noneVat + '+' + (product.quantity * productOnServer.promo_price));
                noneVat += product.quantity * productOnServer.promo_price;
                numTmp = noneVat * 1000;
                vat = numTmp * 10 / 100;
                total = numTmp + vat;
                if (cartTotalNoneVat != null && cartTotalHasVat != null && cartTotal != null) {
                  cartTotalNoneVat.innerHTML = convertPrice(numTmp) + ' đ';
                  cartTotalHasVat.innerHTML = convertPrice(vat) + ' đ';
                  cartTotal.innerHTML = convertPrice(total) + ' đ';
                }
                if ((document.getElementById("checkout__total-final")) != null && checkoutShowProducts != null) {
                  // dua san pham vao check out
                  checkoutShowProducts.insertAdjacentHTML('beforeend', `<p class="checkout__product-in-cart__products"><span>${productOnServer.name}: x &nbsp;</span><span> ${product.quantity}(cây)</span></p>`);
                  document.getElementById("checkout__total-final").innerHTML = convertPrice(total) + ' đ';
                } else if (document.getElementById('order-info') != null) {
                  document.getElementById('order-info__bill').insertAdjacentHTML('beforeend', `<p class="checkout__product-in-cart__products"><span>${productOnServer.name}: x &nbsp;</span><span> ${product.quantity}(cây)</span></p>`);
                  document.getElementById('order-info__total-price').innerHTML = '<b>' + convertPrice(total) + ' đ</b>';
                }
              }
            }
          }
          numTmp = noneVat;
        })
        .catch(function() {
          return console.log('lỗi lấy pr detail cho cart de tinh tong tien rồi');
      });
      break;
    default:
      console.log('loi tinh tong tien trong cart');
      break;
  }
  // ** tinh tong tien van chua toi uu: phai nhan 1000
}
// cancel cart
cancelCart = () => {
  if (confirm("Ban muon huy don hang nay!")) {
    localStorage.removeItem('cart');
    return window.location.href = "index.html";
  }
};
order = () => {
  if (confirm("Xác nhận hoàn tất đơn hàng này?")) {
    localStorage.removeItem('cart');
    return window.location.href = "index.html";
  }
}
// handle json product detail and show(render to html)
handleProductDetail = (data, cFunction) => {
  dbPrDetail = data[0];
  cFunction(); // printProductDetail
};
printProductDetail = () => {
  itemId = dbPrDetail.id;
  itemImg = dbPrDetail.img;
  itemLabel = dbPrDetail.label;
  itemLink = dbPrDetail.link;
  itemName = dbPrDetail.name;
  itemRating = dbPrDetail.rating;
  itemPromo_price = dbPrDetail.promo_price;
  itemPrice = dbPrDetail.price;
  itemGallery = dbPrDetail.gallery;
  itemLong_desc = dbPrDetail.long_desc;
  itemFull_desc = dbPrDetail.full_desc;
  itemCategory = dbPrDetail.category;
  productDetail.insertAdjacentHTML('beforeend', layoutProductDetail());
};
layoutProductDetail = () => {
  const catePath = document.getElementById("cate-path");
  const productDetailImg = document.getElementById("product-detail__img");
  const productDetailGallery = document.getElementById("product-detail__gallery");
  const productDetailName = document.getElementById("product-detail__name");
  const productDetailRating = document.getElementById("product-detail__rating");
  const productDetailPromoPrice = document.getElementById("product-detail__promo-price");
  const productDetailPrice = document.getElementById("product-detail__price");
  const productDetailLongDesc = document.getElementById("product-detail__long-desc");
  const productDetailFullDesc = document.getElementById("product-detail__full-desc");
  catePath.insertAdjacentHTML('beforeend', `
    <a class="product-detail__cate-path__link" href="index.html">
      Home / <a class="product-detail__cate-path__link --cate-active" href="product-detail.html?product=${itemLink}">${itemName}</a>
    </a>
  `);
  productDetailImg.insertAdjacentHTML('beforeend', `
    <img src="../images/sp/${itemImg}"/>
  `);
  for (const iterator of itemGallery) {
    productDetailGallery.insertAdjacentHTML('beforeend', `
      <img src="../images/sp/${iterator}"/>
    `);
  }
  productDetailName.setAttribute('href', `product-detail.html?product=${itemLink}`);
  productDetailName.insertAdjacentHTML('beforeend', `${itemName}`);
  productDetailRating.insertAdjacentHTML('beforeend', productRating(itemRating));
  productDetailPromoPrice.insertAdjacentHTML('beforeend', convertPrice(itemPromo_price) + '.000 đ');
  productDetailPrice.insertAdjacentHTML('beforeend', convertPrice(itemPrice) + '.000 đ');
  productDetailLongDesc.innerHTML = itemLong_desc;
  productDetailFullDesc.innerHTML = '<p>' + itemFull_desc + '</p>';
  productDetail.setAttribute("data-id", itemId);
  // ** need get similar products function
  let eHTML = ``;
  return eHTML;
}

// handle json products recived and show(render to HTML)
function handleProduct(data, cFunction) {
  dbProducts = data;
  for (const item in dbProducts) {
    // add members to dbHighlight/dbHot/dbNew/dbPromo
    let arrTag = dbProducts[item].tag;
    for (const tagID of arrTag) {
      switch (tagID) {
        case 21: // id tag highlight = 21
          dbPrHighlight.push(dbProducts[item]);
          break;
        case 67: // id tag hot = 67
          dbPrHot.push(dbProducts[item]);
          break;
        case 99: // id tag new = 99
          dbPrNew.push(dbProducts[item]);
          break;
        case 11: // id tag promo = 11
          dbPrPromo.push(dbProducts[item]);
          break;
      }
    }
  }
  cFunction();
}


// handle rating
function productRating(point) {
  const faStar = `<i class="fa fa-star" aria-hidden="true"></i>`,
        faStarHalf = `<i class="fa fa-star-half-o" aria-hidden="true"></i>`,
        faStarO = `<i class="fa fa-star-o" aria-hidden="true"></i>`;
  let result = ``;
  // fill solid star
  for(let i = 1; i <= point; i++) {
    if (i%2 == 0) {
      result += faStar;
    }
    if (i == point) {
      if (point%2 != 0) {
        // fill star half
        result += faStarHalf;
        point += 2;
      } else point++;
      break;
    }
  }
  // fill left star
  for(let i = point; i <= 10; i++) {
    if (i%2 == 0) {
      result += faStarO;
    }
    if (i == 10) {
      break;
    }
  }
  return result;
}

function printProduct() {
  if (productNew == null || productPromo == null) {
    totalCart('onDelete',0);
    return false;
  }
  //function layoutProduct(labelProduct, buyBtn, coverHover, list) {
  function layoutProduct(labelProduct, buyBtn, coverHover, list, addCart) {
    let eHTML = `<div class="block__item item-no${count}" data-id="${itemId}">
      <div class="block__item__info-top">
        <div class="block__item__info-top__image"><img src="../../images/sp/${itemImg}"></div>
    `;
    if(labelProduct) {
      eHTML += `
        ${checkLabel(itemLabel)}
      `;
    }
    if(buyBtn) {
      eHTML += `
        <div class="block__item__info-top__buy">
          <button class="--buy-now btn-buy-now uppercase" onClick="buyNow(this);">Mua ngay</button><a class="--more-info btn-more-pr-info" href="product-detail.html?product=${itemLink}"><i class="fa fa-search" aria-hidden="true"></i></a>
        </div>
      `;
    }
    if(addCart) {
      eHTML += `
        <div class="block__item__info-top__add">
          <i class="add-cart fa fa-cart-plus" aria-hidden="true" onClick="addToCart(this);"></i>
        </div>
      `;
    }
    if(coverHover) {
      eHTML += `
        <div class="block__item__info-top__cover"></div>
      `;
    }
    eHTML += `
      </div>
      <div class="block__item__info-bot">
        <div class="block__item__info-bot__title">
          <a href="product-detail.html?product=${itemLink}">
            <h4>${itemName}</h4>
          </a>
        </div>
        <div class="block__item__info-bot__rating">
          ${productRating(itemRating)}
        </div>
        <div class="block__item__info-bot__price"><span class="--price-new">${convertPrice(itemPromo_price)}.000 đ</span><span class="--price-old">${convertPrice(itemPrice)}.000 đ</span></div>
    `;
    if(list) {
      eHTML += `
        <div class="block__item__info-bot__buy">
          <button class="--buy-now btn-buy-now uppercase" onClick="buyNow(this);">Mua ngay</button><a class="--more-info btn-more-pr-info" href="product-detail.html?product=${itemLink}"><i class="fa fa-search" aria-hidden="true"></i></a><a class="--love-product btn-love-pr" href="#"><i class="fa fa-heart" aria-hidden="true"></i></a>
        </div>
      `;
    }
    eHTML += `
        </div>
      </div>
    `;
    return eHTML;
  }
  // productHighlight
  for (const item of dbPrHighlight) {
    count++;
    itemId = item.id;
    itemImg = item.img;
    itemLabel = item.label;
    itemLink = item.link;
    itemName = item.name;
    itemRating = item.rating;
    itemPromo_price = item.promo_price;
    itemPrice = item.price;

    //The insertAdjacentHTML() method inserts a text as HTML, into a specified position.
    productHighlight.insertAdjacentHTML('beforeend', layoutProduct(true, true, true, false, true));
    // layoutProduct(has label: true, has buy button(on image): true, has cover when hover: true, has buy button for list(outsite image): false)

    // limited 6 products
    if (count == 6) {
      count = 0;
      break;
    }
  }

  // productHot
  for (const item of dbPrHot) {
    count++;
    itemId = item.id;
    itemImg = item.img;
    itemLabel = item.label;
    itemLink = item.link;
    itemName = item.name;
    itemRating = item.rating;
    itemPromo_price = item.promo_price;
    itemPrice = item.price;
    
    //The insertAdjacentHTML() method inserts a text as HTML, into a specified position.
    productHot.insertAdjacentHTML('beforeend', layoutProduct(false, false, false, false, false));
    // layoutProduct(has label: true, has buy button(on image): true, has cover when hover: true, has buy button for list(outsite image): false)

    // limited 6 products
    if (count == 6) {
      count = 0;
      break;
    }
  }

  // productPromo
  for (const item of dbPrPromo) {
    count++;
    itemId = item.id;
    itemImg = item.img;
    itemLabel = item.label;
    itemLink = item.link;
    itemName = item.name;
    itemRating = item.rating;
    itemPromo_price = item.promo_price;
    itemPrice = item.price;
    
    //The insertAdjacentHTML() method inserts a text as HTML, into a specified position.
    productPromo.insertAdjacentHTML('beforeend', layoutProduct(true, true, true, false, true));
    // layoutProduct(has label: true, has buy button(on image): true, has cover when hover: true, has buy button for list(outsite image): false)

    // limited 6 products
    if (count == 6) {
      count = 0;
      break;
    }
  }

  // productNew
  for (const item of dbPrNew) {
    count++;
    itemId = item.id;
    itemImg = item.img;
    itemLabel = item.label;
    itemLink = item.link;
    itemName = item.name;
    itemRating = item.rating;
    itemPromo_price = item.promo_price;
    itemPrice = item.price;
    
    //The insertAdjacentHTML() method inserts a text as HTML, into a specified position.
    productNew.insertAdjacentHTML('beforeend', layoutProduct(true, true, true, false, true));
    // layoutProduct(has label: true, has buy button(on image): true, has cover when hover: true, has buy button for list(outsite image): false)

    // limited 8 products
    if (count == 8) {
      count = 0;
      break;
    }
  }
  
  // check has label
  function checkLabel(label) {
    let result = "";
    for (const item of dbPrLabel) {
      if (label == item.id) {
        switch (item.labelSlug) {
          case 'new':
            result = `<div class="block__item__info-top__desc label-pr-new"><span>${item.labelName}</span></div>`;
            break;
          case 'promo':
            result = `<div class="block__item__info-top__desc label-pr-saleoff"><span>${item.labelName}</span></div>`;
            break;
        }
      }
    }
    return result;
  }
}

// handle checkout and payment
addToCart = e => {
  // e: element clicked
  if (e.closest('#product-detail')) {
    itemId = e.closest('#product-detail').getAttribute('data-id');
    buyNowIs = true;
  } else {
    // check btb is buy now or add to cart
    if((e.getAttribute('class')).match(/btn-buy-now/) != null) buyNowIs = true;
    else buyNowIs = false;
    itemId = e.closest('.block__item').getAttribute('data-id');
    // ** Chức năng click mua ngay xuất hiện modal thông tin sản phẩm
    // let tmpDiv = document.createElement('div');
    // let modalBuyNow = document.body.insertAdjacentElement('beforeend', tmpDiv);
    // modalBuyNow.setAttribute('id', '#modal-buy-now');
    // tmpDiv.insertAdjacentHTML('beforeend', `
    //   <div class="modal-buy-now__content"></div>
    // `);
  }
  itemId = parseInt(itemId);
  // get cart in localStorage and then update cart
  cartLocalStorage = localStorage.getItem("cart");
  // check if cart exists in local storage
  if (cartLocalStorage == null) {
    localStorage.setItem('cart', JSON.stringify([{id:itemId,quantity:1}]));
  } else {
    addProductToCart(itemId);
  }
  countProductInCart('pages');
}
buyNow = e => {
  // e: element clicked
  buyNowIs = true;
  addToCart(e);
};

// handle local storage
/// check product exist
checkProductExist = () => {
  cartLocalStorage = JSON.parse(cartLocalStorage);
  let result = false;
  for (const key in cartLocalStorage) {
    // find id match vs cartLocalStorage[key].id
    if (cartLocalStorage[key].id == itemId) {
      indexOfProductExist = key;
      result = true;
      break;
    }
  }
  return result;
};
/// add product to local storage
addProductToCart = itemId => {
  let indexOfProductExist;
  if(checkProductExist()) {
    // exist product
    updateQuantityInCart();
  } else {
    // not exist product
    addNewProductToCart();
    return (buyNowIs == true)?window.location.href = "cart.html":false;
  }
};
addNewProductToCart = () => {
  // add
  cartLocalStorage.push({id:itemId,quantity:1});
  // update local storage
  localStorage.setItem('cart', JSON.stringify(cartLocalStorage));
}
updateQuantityInCart = () => {
  quantity = cartLocalStorage[indexOfProductExist].quantity;
  // check for btn buy now: if add cart already then go to cart, stop increase quantity
  if(quantity >= 1 && buyNowIs) {
    buyNowIs = false;
    // The difference between href and replace, is that replace() removes the URL of the current document from the document history, meaning that it is not possible to use the "back" button to navigate back to the original document.
    return window.location.href = "cart.html";
  }
  // quantity + 1
  cartLocalStorage[indexOfProductExist].quantity++;
  // update local storage
  localStorage.setItem('cart', JSON.stringify(cartLocalStorage));
}

// convert price
function convertPrice(price) {
  //convert number to string
  let converted = price.toString();
  //split string to array
  let tmp = converted.split("");
  // count
  let c = 0;
  for (let i = converted.length; i > 1; i--) {
    c++;
    if (c%3 == 0) {
      tmp[i-1] = "." + tmp[i-1];
    }
  }
  // convert array(join array members) to string
  return tmp.join("");
};

//make request
function makeRequest(url, requestType, data) {
  return new Promise(function(resolve, reject) {
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      // readyState	Holds the status of the XMLHttpRequest.
      //   0: request not initialized
      //   1: server connection established
      //   2: request received
      //   3: processing request
      //   4: request finished and response is ready
      //
      // status	200: "OK"
      //        403: "Forbidden"
      //        404: "Page not found"
      if(xhttp.readyState == 4 && xhttp.status == 200) {
        //assign response into products; initialize products
        // console.log(recived);
        resolve(JSON.parse(xhttp.responseText));
      }
    }
    xhttp.onerror = reject;
    xhttp.open(requestType, url, true);
    // xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(data);
  });
}

// When local storage changes, render cart to get new product added
window.addEventListener('storage', () => {
  // check if page is cart. avoid render multi page
  if (productCart != null) {
    let parentOfElementNeedRemove = productCart.querySelectorAll('.cart__bought__form__table__item');
    for (const element of parentOfElementNeedRemove) {
      element.remove();
    }
  }
  handleProductCart();
});
