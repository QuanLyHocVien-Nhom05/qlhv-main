// These checks run directly against local SQL Server, outside the Playwright runner.
exports.expect=require('@playwright/test').expect.configure({timeout:30000});
