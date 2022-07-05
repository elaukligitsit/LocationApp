# GeoLock
Our project, GeoLock, is a social app that encourages users to explore and share their experience of locations and areas around them. Users are able to search up possible locations they are interested in and see other user’s comments. In addition if they visit the location then they are able to comment on it. Once registered and logged in, users will be able to like, dislike, and favorite comments they find interesting and can find the posts they have liked and favorited on their profile page. 

[![Watch the video](https://img.youtube.com/vi/ge318HafUEg/maxresdefault.jpg)](https://youtu.be/ge318HafUEg)

## Repository Organization
The repository is organized by three main folders, along with some additional files: Our Milestone Submissions, tutorials we followed as a guide, and our webpage code. 
### Webpage Code
The webpage code contains all our code for the project. Inside our webpage directory we have code to initialize our database, heroku, and all our html and ejs code in the src/views folder.
### Tutorials
This folder contains tutorials we wanted to save because we thought they would be useful later in the project.
### Milestone Submissions
This folder contains all our milestone submission documents. This shows our progress throughout the project and the different changes we made.
### Additional Files
.DS_Store, .gitignore, and .swp are all necessary files for our locations. We also have a team meeting logs of when we met with our TA.
## Code
### How to Run Code:
1. First you need to download docker in order to run the code
2. Pull the latest commit from main and go into the webpage code directory
3. Start docker
4. Go to your desired browser and type “localhost:3000”

![image](https://user-images.githubusercontent.com/71091132/143988894-f218e0a9-f2e7-48c0-8d6e-7d3b5152dd57.png)

### How to Add Code:
1. Go to your branch, or make one if necessary
2. Pull latest commit from main
3. Go into webpage code directory -> src -> views 
4. If adding html code go into html directory, otherwise go into pages
5. Create desired code
6. When functional create a pull request and verify there are no merge conflicts
7. Merge with main

### Checking Code:
1. Go to the created webpage
2. Check whether functions give desired output
3. Check Docker for any other issues

### How to Add Test Cases:
1. To create test cases we need Docker, Mocha, and Chai
2. Create positive and negative test cases 
3. Look at docker to see whether the test cases failed or passed
