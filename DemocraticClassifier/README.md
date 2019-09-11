# Problem Statement:

Given the common ground of the 2020 presidential nominees for the Democratic Party, would it be possible to use Classification modeling and Natural Language Processing techniques, to take a random headline and body text from a candidate's Subreddit and determine which subreddit it came from.



# Executive Summary

In order to accomplish this challenge, I first had to scrape the four official Subreddit pages of these candidates using the Reddit API, and some custom python code to iterate through each candidate.  With only 25 pages allowed per request, it was necessary to create a function to make this request repeatedly.  

After having the data in hand, it was then necessary to clean it with regular expressions, vectorize it with TF-IDF, combine it all together, and finally label encode it to model on this multi-class classification problem.

I chose to experiment on a number of different models advanced models including Random Forest, Grandient Boosting, and Naive Bayes (Gaussian and Multinomial).  However, I ended up focusing on a Logistic Regression model.  It not only had the highest testing accuracy score of any of the models, but it also made it easiest to explain the results.





# Conclusions & Recommendations

After a painstaking attempt to use classification modeling techniques (excluding neural networks), it was determined to be very difficult to classify the 4 thousand+ documents collected from the subreddits of Bernie Sanders, Elizabeth Warren, Kamala Harris, and Pete Buttigieg.  However, three benchmarks are worth noting right off the top.

First, the baseline accuracy was only 26%, as we were training the models on four different classes.  There was also one unbalanced class, as I was not able to collect quite as many posts from the Elizabeth Warren Subreddit.

Second, the accuracy was actually quite high (close to 90%) when the candidate names / nicknames were left in the model.  However, I found it more interesting to try to create a model that excluded these, in order to see if there are any strong cultural or policy differentiators between the candidates.

And third, while the model that took these considerations under advisement performed with an accuracy of only 52%, the is still double the baseline score, and it provided us with a handfull of insights about how the candidates are within the Reddit bubble.  

The fact that Elizabeth Warren's top 3 features were 'plan', 'policy', and 'theory', speak to her brand and ability to lead with ideas.  Pete Buttigieg and Kamala Harris were both strongly tied to their homes, South Bend, IN and California, respectively.  This is notable, more so that this hometown boost is not the case for Warren or Sanders.  Buttigieg's top coefficient feature was 'Chasten', his husband's name.  This is likely part in due to an effort for him to come across as a man of family values.  For Kamala Harris, her top coefficient feature was 'Barr', as in the attorney general Bill Barr. This speaks to her brand as a tough prosecutor who is be willing to stand in front of someone like Barr.  She also has a high coefficient for 'women', which again, is interesting that Warren didn't dilute that coefficient more. Finally, Bernie Sander's top feature coefficient was photo at almost 10x the odds of any other candidate.  This speaks to him as a celebrity.  However, there is also some substance.  His next top coefficients are 'insurance' and 'medicare', two topics that he has led the charge on over the past 4 years.  He has 5x the odds of any other candidate for those words.  

My recommendations to the candidates would be to double down on what makes them stand out from the crowd, and possibly more importantly, the topics that they WANT to differentiate themselves with.  Sanders has done this, and Warren has established herself as the policy candidate.  Harris and Buttigieg, while they come across as having strong minds to solve big problems, people aren't latching onto any one of them.  This was one area that also hurt Hillary Clinton in 2016, and it would serve these candidates well to attack it head on with one or two passion projects that stand above the rest.  

If I were to make recommendations on how to improve the project and the modeling, it would first and foremost come down to more data collection.  I misunderstood how the Reddit API works, and therefore was only able to collect about 4000 posts between the 4 candidates.  I would love to see how the models would turn out differently given a much wider lense of voter opinion.

Second, there are a number of additional models that I would love to try on this problem, that I do not have the expertise at yet (NLP technologies that use Neural Networks), or struggled implementing (XGBoost).  I hope to double back on these challenges with a future project as I continue to learn how to better implement my ideas into the data science work flow.  
