function addLike(id_){
    var xmlhttp = new XMLHttpRequest();
    var badge = "likeBadge" + id_;
    var like = "like" + id_;
    var dislike = "dislike" + id_;
    console.log(badge);
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          document.getElementById(`${badge}`).innerHTML = this.responseText;
      }
    };
    var comm = {
      value: document.getElementById(`${like}`).value
    }
    xmlhttp.open("put", `/likeComment/${id_}`, true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xmlhttp.send();

    // disable like button and enable dislike button
    document.getElementById(`${like}`).disabled = true;
    document.getElementById(`${dislike}`).disabled = false;
}

// fuction called on click of dislike button
// decrements like count of comment in db
function removeLike(id_){
    var xmlhttp = new XMLHttpRequest(); // initialize new request
    var badge = "likeBadge" + id_;
    var like = "like" + id_;
    var dislike = "dislike" + id_;
    console.log(badge);
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          document.getElementById(`${badge}`).innerHTML = this.responseText; // recieves information from response when req is finished
      }
    };
    var comm = {
      value: document.getElementById(`${dislike}`).value
    }
    xmlhttp.open("put", `/dislikeComment/${id_}`, true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xmlhttp.send();

    // disable dislike button and enable like button
    document.getElementById(`${like}`).disabled = false;
    document.getElementById(`${dislike}`).disabled = true;
}

// Favorites 
function favorites(id_){
    var xmlhttp = new XMLHttpRequest(); // initialize new request
    var badge = "favBadge" + id_;
    var fav = "favorite" + id_;
    xmlhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
            document.getElementById(`${badge}`).innerHTML = this.responseText;
      }
    };
    var comm = {
        value: document.getElementById(`${fav}`).value
    }
    xmlhttp.open("put", `/addFavoriteComment/${id_}`, true);
    xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xmlhttp.send();
    
}