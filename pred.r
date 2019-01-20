#dat<-read.csv("now.csv")

# Give the chart file a name.
#png(file = "line_chart.jpg")
#AQI<-dat$aqi
#gti<-c(250,255,270,257,280,310,330,335,340)
#time<-dat$time
# Plot the bar chart. 
#plot(AQI,type = "o",col="red",xlab = "time",ylab="AQI",main="Past 9 Hours")

# Save the file.
#dev.off()

#

#########################################

########################
dat<-read.csv("now.csv")
df<-data.frame(dat)
datamod<-lm(nextaqi~polym(time+temp+humi+wind+aqi,degree=5,raw=TRUE),data=df)
predict(datamod,read.csv(ins))



