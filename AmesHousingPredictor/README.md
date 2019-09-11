## Problem Statement

Through the analysis and modeling of the Ames, Iowa dataset of 2006 - 2010 home sales, can a best mix of features and model processes be constructed to predict the sale price of homes in a given market?

## Executive Summary

Through careful data analysis and regression modeling, I have been able to accurately predict housing prices off of a collection of 80+ data points for each Ames, Iowa home sale to a mean R Squared score of over .95, and a Root Mean Squared Error of ~18,000.

In order to accomplish this, I first cleaned the data of any missing values, and replaced those values with my best judgement when applicable.  Given that this is a generalized housing price predictor model for a city, I allowed myself to generalize some of the missing values, specifically for the category of 'Lot Frontage'.  This feature had a relatively weak correlation to the home Sale Price, but since I did not want to lose the valuable training data available in rows with missing information, I generalized the missing value to the mean for the category as a whole. The model improved as a result of this, and I take that as confirmation that it was an adequate solution to unfortunate data problem.  Again, given the relatively low stakes of the modeling challenge, I felt more inclined to aim for high accuracy than reduce substantial failure to predict outliers.  

Next, it was important to dig through categorical features and decide whether it would be better to one hot encode them, or restate them as ranked numerical data.  After A/B testing models of many of these features both ways, I chose to dummy encode almost every feature, trusting the regression model to construct a more accurate mathematical interpretation of the categories than my arbitrarily weighted rankings were able to.  

In addition, before getting a baseline model, I dug through the strongest correlations to the target variable, 'Sale Price', and followed my insights from the data exploration process to manually combine some of the strongest correlated features.  Through this process I discovered new polynomial features that turned out to have a higher correlation to the target than any of the original categories.  To enhance this feature's potential, I normalized its distribution by taking its natural log, and then used this logarithm as a multiplier for each value in my features DataFrame for the model.  At that point, the target distribution was also normalized by taking its logarithm and the modeling process began.  

3 models were tested and K-Fold cross validated.  Linear regression used the original data, but for the Lasso and Ridge regression models, I first normalized the data via Standard Scaler, and then fit and tested them.  While the results were relatively similar across models, the best result came from the Lasso Regression.  Lastly, I plotted the residual errors from my test, added them as a series in my DataFrame, scoured through the results.  And ultimately decided to toss out any rows that were more than three standard deviations away from the mean.  As of this writing, this model is the most accurate (#1) linear regression model for this data set amongst all participants.


### Contents:
- [Data Import & Cleaning](#Data-Import-and-Cleaning)
- [Exploratory Data Analysis](#Exploratory-Data-Analysis)
- [Data Visualization](#Visualize-the-data)
- [Descriptive and Inferential Statistics](#Descriptive-and-Inferential-Statistics)
- [Outside Research](#Outside-Research)
- [Conclusions and Recommendations](#Conclusions-and-Recommendations)

## Data Dictionary

<a href = "http://jse.amstat.org/v19n3/decock/DataDocumentation.txt">Link to original data dictionary. </a>

## Conclusions and Recommendations

There is an important balance to be made between intuition, intellectual insight, and the use of machine learning to deliver difficult mathematical interpretations.  As one A/B test taught me, blindly trusting the regression techniques, multiplier functions, and scaling functions can very quickly give you a decent model.  However, my very best model included a combination of manual feature selection and machine learning.  I imagine, given more effort and trial and error, I could fine tune a model to result in an even more predictive model.   


That being said, there are a few main recommendations that could be gleaned from the analysis of this dataset.  First, while it should be no huge surprise, quality of home, and general living area size were by far the most predictive factors of a home's sale price.  This was true across all lot sizes and neighborhoods.   Using  powerful Python-based data science techniques, I was able to narrow in on where one might search for their ideal home.  

First,  the best quality low priced homes can be found in the Veenker and Edwards neighborhoods.  These are generally not the most sought after communities at the moment, but you can find a quality home for well below market rate by moving a few streets away.

Next, if you're looking for a large lot, there's no better place than Clear Creek.  With an average lot size of over 15,000 square foot, you can grow all the corn you need for a quality Iowa farm, or build yourself out a luxury estate.  

If you want only the very best, and your neighbors' homes to also be the very best.  look to Stone Brook, Northridge Heights, and Northridge for the best rated homes on average.  Similarly, if you are concerned that your neighbors' homes be well maintained, I recommend looking into Crawford, Old Town and Brookside.  

Lastly, if the age of your home is most important to you, Old Town, not surprisingling has the oldest (and also best maintained) properties, dating back to the post civil war era.  In contrast, if you want to hop into a freshly constructed, ready to go home, look into Bloomington and Northridge Heights.  These two developments have only been around for a dozen or so years, and contain many of the amenities of modern living.  
