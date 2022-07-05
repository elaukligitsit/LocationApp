function openRegistration() {

    // creating local vars to limit getElementById calls
    var myInput = document.getElementById("psw");
    var confirmMyInput = document.getElementById("cpsw");
    var lower = document.getElementById("lower");
    var upper = document.getElementById("upper");
    var number = document.getElementById("number");
    var length = document.getElementById("length");
    var match = document.getElementById("match");
  
    // When the user starts to type something inside the password field
    myInput.onkeyup = function () {
      console.log("helllooo");
  
      // regular expression implementation
      // lowercase, uppercase, all digits, and min lenght for password
      var lowerRegex = /\p{Ll}/gu; 
      var upperRegex = /\p{Lu}/gu; 
      var numbers = /\d/g; 
      var minLength = 8; 
      
      
      if (myInput.value.match(lowerRegex)) {
        lower.classList.remove("invalid");
        lower.classList.add("valid");
      } else {
        lower.classList.remove("valid");
        lower.classList.add("invalid");
      }
  

      if (myInput.value.match(upperRegex)) {
        upper.classList.remove("invalid");
        upper.classList.add("valid");
      } else {
        upper.classList.remove("valid");
        upper.classList.add("invalid");
      }
  
      if (myInput.value.match(numbers)) {
        number.classList.remove("invalid");
        number.classList.add("valid");
      } else {
        number.classList.remove("valid");
        number.classList.add("invalid");
      }
  

      if (myInput.value.length >= minLength) {
        length.classList.remove("invalid");
        length.classList.add("valid");
      } else {
        length.classList.remove("valid");
        length.classList.add("invalid");
      }

    };
  

    confirmMyInput.onkeyup = function () {
      
      var passEqualsConfPass = myInput.value == confirmMyInput.value; 
      if (passEqualsConfPass) {
        match.classList.remove("invalid");
        match.classList.add("valid");
      } else {
        match.classList.remove("valid");
        match.classList.add("invalid");
      }
      
  
     
      enableSubmit(lower, upper, number, length, match);
    };
}
  
  function enableSubmit(lower, upper, number, length, match) {
    
    var button = document.getElementById("submit_button");
    var condition = (lower.classList[0] == "valid") &&
                    (upper.classList[0] == 'valid') &&
                    (number.classList[0] == "valid") &&
                    (length.classList[0] == "valid") &&
                    (match.classList[0] == "valid");
    if (condition) {
      button.disabled = false;
    }
    else {
      button.disabled = true;
    }
  }
  
  function onSubmissionClick() {
    //alert("Welcome!");
  }
  