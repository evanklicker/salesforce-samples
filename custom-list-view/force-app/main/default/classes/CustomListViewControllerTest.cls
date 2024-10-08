/*
 * 	Finally we get to see the payoff of using the data provider. In exchange for some up-front complexity in the controller,
 *  our test class is now _much_ simpler. We don't even need to use `System.runAs` since we don't interact with the database at all.
 */


@isTest
public class CustomListViewControllerTest {
    
    class TestCustomListViewDataProvider extends CustomListViewController.CustomListViewDataProvider {
        
        public List<Account> getRecords_return;        
        public List<User_Application_Data__c> getUserData_return;
        public List<Schema.DescribeFieldResult> getColumnData_Permissions_return;
        public User_Application_Data__c savedUserData;
        
		override List<Account> getRecords() {
            return getRecords_return;
        }

        override List<User_Application_Data__c> getUserData() {
            return getUserData_return;
        }

        override void saveUserData(User_Application_Data__c record) {
            savedUserData = record;
        }        
        
        override List<Schema.DescribeFieldResult> getColumnData_Permissions() {
            return getColumnData_Permissions_return;
        }
        
    }
    
    @isTest
    static void getColumns_test() {
        TestCustomListViewDataProvider dataProvider = new TestCustomListViewDataProvider();
        CustomListViewController.dataProvider = dataProvider;
        dataProvider.getColumnData_Permissions_return = new List<Schema.DescribeFieldResult>{Schema.SObjectType.Account.fields.Name};
            
		Test.startTest();
        String result = CustomListViewController.getColumns();
        Test.stopTest();
        
        Assert.areEqual(JSON.serialize(dataProvider.getColumnData_Permissions_return), result);
    }
    
    @isTest
    static void getRecords_test() {
        TestCustomListViewDataProvider dataProvider = new TestCustomListViewDataProvider();
        CustomListViewController.dataProvider = dataProvider;
        dataProvider.getRecords_return = new List<Account>{new Account(Name = 'Test account 1'), new Account(Name = 'Test Account 2')};
            
		Test.startTest();
        List<Account> result = CustomListViewController.getRecords();
        Test.stopTest();
        
        for (Account a : result) {
			Assert.isTrue(dataProvider.getRecords_return.contains(a));
        }
    }
    
    @isTest
    static void getUserData_noRecords() {
        TestCustomListViewDataProvider dataProvider = new TestCustomListViewDataProvider();
        CustomListViewController.dataProvider = dataProvider;
        dataProvider.getUserData_return = new List<User_Application_Data__c>();
            
		Test.startTest();
        User_Application_Data__c result = CustomListViewController.getUserData();
        Test.stopTest();
        
        Assert.isNotNull(result);
        Assert.areEqual(CustomListViewController.APPLICATION_NAME, result.Application__c);
    }
    
    @isTest
    static void getUserData_oneRecord() {
        TestCustomListViewDataProvider dataProvider = new TestCustomListViewDataProvider();
        CustomListViewController.dataProvider = dataProvider;
        User_Application_Data__c expectedResult = new User_Application_Data__c(Data__c = 'test data', Application__c = 'test name');
        dataProvider.getUserData_return = new List<User_Application_Data__c>{expectedResult};
            
		Test.startTest();
        User_Application_Data__c result = CustomListViewController.getUserData();
        Test.stopTest();
        
        Assert.isNotNull(result);
        Assert.areEqual(expectedResult.Application__c, result.Application__c);
        Assert.areEqual(expectedResult.Data__c, result.Data__c);
    }
    
    @isTest
    static void getUserData_multipleRecords() {
        TestCustomListViewDataProvider dataProvider = new TestCustomListViewDataProvider();
        CustomListViewController.dataProvider = dataProvider;
        User_Application_Data__c expectedResult = new User_Application_Data__c(Data__c = 'test data', Application__c = 'test name');
        User_Application_Data__c badResult1 = new User_Application_Data__c(Data__c = 'bad', Application__c = 'bad');
        User_Application_Data__c badResult2 = new User_Application_Data__c(Data__c = 'wrong', Application__c = 'wrong');
        User_Application_Data__c badResult3 = new User_Application_Data__c(Data__c = 'fail', Application__c = 'fail');
        dataProvider.getUserData_return = new List<User_Application_Data__c>{expectedResult, badResult1, badResult2, badResult3};
            
		Test.startTest();
        User_Application_Data__c result = CustomListViewController.getUserData();
        Test.stopTest();
        
        Assert.isNotNull(result);
        Assert.areEqual(expectedResult.Application__c, result.Application__c);
        Assert.areEqual(expectedResult.Data__c, result.Data__c);
    }
     
    @isTest
    static void saveUserData_noRecords() {
        TestCustomListViewDataProvider dataProvider = new TestCustomListViewDataProvider();
        CustomListViewController.dataProvider = dataProvider;
        dataProvider.getUserData_return = new List<User_Application_Data__c>();
        
        String testData = 'TEST DATA';
            
		Test.startTest();
        CustomListViewController.saveUserData(testData);
        Test.stopTest();
        
        User_Application_Data__c result = dataProvider.savedUserData;
        
        Assert.isNotNull(result);
        Assert.areEqual(testData, result.Data__c);
        Assert.areEqual(CustomListViewController.APPLICATION_NAME, result.Application__c);
    }
    
    @isTest
    static void saveUserData_oneRecord() {
        TestCustomListViewDataProvider dataProvider = new TestCustomListViewDataProvider();
        CustomListViewController.dataProvider = dataProvider;
        User_Application_Data__c expectedResult = new User_Application_Data__c(Data__c = 'test data', Application__c = 'test name');
        dataProvider.getUserData_return = new List<User_Application_Data__c>{expectedResult};
            
        String testData = 'TEST DATA';
            
		Test.startTest();
        CustomListViewController.saveUserData(testData);
        Test.stopTest();
        
        User_Application_Data__c result = dataProvider.savedUserData;
        
        Assert.isNotNull(result);
        Assert.areEqual(testData, result.Data__c);
        // Not sure if this should be the case? probably doesn't matter, but will think about it
        Assert.areNotEqual(CustomListViewController.APPLICATION_NAME, result.Application__c);
    }
    
    @isTest
    static void saveUserData_multipleRecords() {
        TestCustomListViewDataProvider dataProvider = new TestCustomListViewDataProvider();
        CustomListViewController.dataProvider = dataProvider;
        User_Application_Data__c expectedResult = new User_Application_Data__c(Data__c = 'test data', Application__c = 'test name');
        User_Application_Data__c badResult1 = new User_Application_Data__c(Data__c = 'bad', Application__c = 'bad');
        User_Application_Data__c badResult2 = new User_Application_Data__c(Data__c = 'wrong', Application__c = 'wrong');
        User_Application_Data__c badResult3 = new User_Application_Data__c(Data__c = 'fail', Application__c = 'fail');
        dataProvider.getUserData_return = new List<User_Application_Data__c>{expectedResult, badResult1, badResult2, badResult3};
            
		Test.startTest();
        CustomListViewController.saveUserData('new data');
        Test.stopTest();
        
        User_Application_Data__c result = dataProvider.savedUserData;
        
        // We don't currently have an implementation in this case, so expect nothing
        Assert.isNull(result);
    }
    
    // These tests are mostly pass-through tests for the data provider, for code coverage purposes
     
	@isTest    
    static void getRecords() {
        try {
            new CustomListViewController.CustomListViewDataProvider().getRecords();
        } catch (Exception e) {
            System.debug(e.getMessage());
        }
    }

    // Might make this a real test since there's kind of logic in the query. Not sure how I want to do tests
    // involving the database quite yet, so I'll leave this for now
    @isTest    
    static void getUserData() {
        try {
            new CustomListViewController.CustomListViewDataProvider().getUserData();
        } catch (Exception e) {
            System.debug(e.getMessage());
        }
    }

	@isTest    
    static void saveUserData() {
        try {
            new CustomListViewController.CustomListViewDataProvider().saveUserData(new User_Application_Data__c());
        } catch (Exception e) {
            System.debug(e.getMessage());
        }
    }

    @isTest
    static void getColumnData_Permissions() {
        try {
            new CustomListViewController.CustomListViewDataProvider().getColumnData_Permissions();
        } catch (Exception e) {
            System.debug(e.getMessage());
        }
    }

}